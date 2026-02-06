import { Link } from "react-router-dom";
import { CircleFadingPlusIcon, Compass, MessageSquare, Settings, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const Navbar = () => {
  const { authUser } = useAuthStore();

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Kapota</h1>
            </Link>
          </div>

          <div className="flex items-center md:gap-9 gap-5">
            {authUser && (
              <>
                <Link to={'/status'} className={`hover:text-base-200 transition-color tooltip tooltip-bottom`}data-tip='Status'>
                  <CircleFadingPlusIcon className="size-5"/>
                </Link>
                <Link to={'/explore'} className={`hover:text-base-200 transition-color tooltip tooltip-bottom`}data-tip='Explore'>
                  <Compass className="size-5" />
                </Link>
                <Link
                  to={"/setting"}
                  className={`hover:text-base-200 transition-color tooltip tooltip-bottom`}data-tip='Setting'
                >
                  <Settings className="size-5" />
                </Link>

                <Link to={"/profile"}>
                  <img src={authUser.profilePic.url} className="border border-base-200 object-cover rounded-full size-10" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;