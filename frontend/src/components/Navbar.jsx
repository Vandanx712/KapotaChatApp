import { Link, NavLink } from "react-router-dom";
import { Compass, ImagePlus, Settings, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import LoadableImage from "./common/LoadableImage";
import Logo from "./common/Logo";

const Navbar = () => {
  const { authUser } = useAuthStore();
  const navLinkClass = ({ isActive }) =>
    `tooltip tooltip-bottom flex size-9 items-center justify-center rounded-lg transition-colors ${
      isActive
        ? "bg-primary/10 text-primary"
        : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
    }`;

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-xl bg-base-100/80"
    >
      <div className="h-[72px] px-5">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <Logo />
              <h1 className="text-lg font-bold">Kapota</h1>
            </Link>
          </div>

          <nav aria-label="Primary navigation" className="flex items-center gap-3">
            {authUser && (
              <>
                <NavLink
                  to="/addpost"
                  className={navLinkClass}
                  data-tip="Add post"
                  aria-label="Add post"
                >
                  <ImagePlus className="size-5" />
                </NavLink>
                <NavLink
                  to="/explore"
                  className={navLinkClass}
                  data-tip="Explore"
                  aria-label="Explore"
                >
                  <Compass className="size-5" />
                </NavLink>
                <NavLink
                  to="/setting"
                  className={navLinkClass}
                  data-tip="Settings"
                  aria-label="Settings"
                >
                  <Settings className="size-5" />
                </NavLink>

                <NavLink
                  to="/profile"
                  aria-label="Profile"
                  className={({ isActive }) =>
                    `block size-10 rounded-full ${
                      isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100" : ""
                    }`
                  }
                >
                  <LoadableImage
                    src={authUser.profilePic?.url}
                    alt={authUser.fullname || "Profile"}
                    className="rounded-full size-10 border border-base-200 object-cover"
                    wrapperClassName=" rounded-full"
                    fallback={
                      <div className="flex h-full w-full items-center justify-center rounded-full border border-base-200 bg-base-300 text-base-content/70">
                        <User className="size-5" />
                      </div>
                    }
                    imgProps={{ loading: "eager", decoding: "async" }}
                  />
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
