import { Link } from "react-router-dom";
import { Compass, ImagePlus, MessageSquare, Settings, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import LoadableImage from "./common/LoadableImage";
import Logo from "./common/Logo";

const Navbar = () => {
  const { authUser } = useAuthStore();

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-xl bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-[72px]">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <Logo />
              <h1 className="text-lg font-bold">Kapota</h1>
            </Link>
          </div>

          <div className="flex items-center md:gap-9 gap-5">
            {authUser && (
              <>
                <Link to={'/addpost'} className={`hover:text-secondary transition-color tooltip tooltip-bottom`}data-tip='Add Post'>
                  <ImagePlus className="size-5"/>
                </Link>
                <Link to={'/explore'} className={`hover:text-secondary transition-color tooltip tooltip-bottom`}data-tip='Explore'>
                  <Compass className="size-5" />
                </Link>
                <Link
                  to={"/setting"}
                  className={`hover:text-secondary transition-color tooltip tooltip-bottom`}data-tip='Setting'
                >
                  <Settings className="size-5" />
                </Link>

                <Link to={"/profile"} className="block size-10">
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
