
import { useState, useEffect, useCallback } from "react";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  Menu,
  X,
  CarFront,
  LayoutDashboard,
  Search,
  CalendarCheck,
  LogOut,
  UserCircle,
  UserRound,
  Handshake,
  Inbox,
  BriefcaseBusiness,
  Bell,
  Users,
  PlusCircle,
  Map,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { getUnreadNotificationCount } from "../services/notificationService";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const navLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Find a Ride",
      path: "/rides",
      icon: Search,
      end: true,
    },
    {
      name: "Offer a Ride",
      path: "/rides/create",
      icon: PlusCircle,
      end: true,
    },
    {
      name: "My Bookings",
      path: "/my-bookings",
      icon: CalendarCheck,
    },
    {
      name: "My Rides",
      path: "/my-rides",
      icon: CarFront,
    },
    {
      name: "Find Trips",
      path: "/trips",
      icon: Map,
      end: true,
    },
    {
      name: "Create Trip",
      path: "/trips/create",
      icon: PlusCircle,
    },
    {
      name: "My Trips",
      path: "/my-trips",
      icon: Users,
    },
    {
      name: "Find Cab Shares",
      path: "/cab-shares",
      icon: CarFront,
      end: true,
    },
    {
      name: "Create Cab Share",
      path: "/cab-shares/create",
      icon: PlusCircle,
    },
    {
      name: "My Cab Shares",
      path: "/my-cab-shares",
      icon: Users,
    },
    {
      name: "Marketplace",
      path: "/marketplace",
      icon: Handshake,
    },
    {
      name: "My Exchanges",
      path: "/my-exchange-requests",
      icon: Inbox,
    },
    {
      name: "Received Requests",
      path: "/received-exchange-requests",
      icon: BriefcaseBusiness,
    },
    {
      name: "My Services",
      path: "/my-services",
      icon: BriefcaseBusiness,
    },
  ];

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadNotificationCount();

      if (response?.success === false) return;

      const count =
        response?.count ??
        response?.unreadCount ??
        response?.data?.count ??
        response?.data?.unreadCount ??
        0;

      setUnreadCount(Math.max(0, Number(count) || 0));
    } catch (error) {
      console.error(
        "Unable to fetch unread notification count:",
        error
      );
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 30000);

    const handleNotificationUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener(
      "notifications-updated",
      handleNotificationUpdate
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener(
        "notifications-updated",
        handleNotificationUpdate
      );
    };
  }, [fetchUnreadCount]);

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getLinkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-emerald-50 text-emerald-700"
        : "text-slate-600 hover:bg-slate-100 hover:text-emerald-700"
    }`;

  const NotificationButton = ({ mobile = false }) => (
    <Link
      to="/notifications"
      onClick={() => setMobileMenuOpen(false)}
      aria-label={`Notifications${
        unreadCount > 0 ? `, ${unreadCount} unread` : ""
      }`}
      title="Notifications"
      className={`relative flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 ${
        mobile ? "h-11 w-11" : "h-10 w-10"
      }`}
    >
      <Bell size={22} strokeWidth={2.2} />

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );

  const ProfileButton = () => (
    <Link
      to="/profile"
      title="My Profile"
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-100 bg-emerald-50 text-emerald-700 transition hover:border-emerald-400"
    >
      {user?.profilePhoto ? (
        <img
          src={user.profilePhoto}
          alt="Profile"
          className="h-full w-full object-cover"
        />
      ) : (
        <UserCircle size={25} />
      )}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex shrink-0 items-center gap-2"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <CarFront size={25} />
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Move<span className="text-emerald-600">Mate</span>
            </h1>

            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              Community Mobility
            </p>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-1 xl:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.end}
                className={getLinkClass}
              >
                <Icon size={16} />
                {link.name}
              </NavLink>
            );
          })}
        </div>

        {/* Right side actions */}
        <div className="flex shrink-0 items-center gap-3">
          <NotificationButton />
          <ProfileButton />

          <button
            type="button"
            onClick={handleLogout}
            className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600 md:flex"
          >
            <LogOut size={17} />
            Logout
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 xl:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X size={25} />
            ) : (
              <Menu size={25} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white xl:hidden">
          <div className="max-h-[75vh] overflow-y-auto px-4 py-4">

            <div className="mb-4 flex items-center gap-3 rounded-xl bg-emerald-50 p-3">
              <UserRound
                size={22}
                className="text-emerald-700"
              />

              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {user?.name || "Community Member"}
                </p>

                <p className="text-xs text-slate-500">
                  MoveMate Member
                </p>
              </div>
            </div>

            <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <span className="text-sm font-semibold text-slate-700">
                Notifications
              </span>

              <NotificationButton mobile />
            </div>

            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={getLinkClass}
                  >
                    <Icon size={18} />
                    {link.name}
                  </NavLink>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
