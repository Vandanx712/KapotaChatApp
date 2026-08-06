import { CheckCheck, LockKeyhole, MessageCircle } from "lucide-react";
import Logo from "./common/Logo";

const AuthImagePattern = ({ title, subtitle }) => {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden bg-[#10201a] px-12 py-10 text-white xl:flex xl:items-center xl:justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <Logo size={40} />
          <div>
            <p className="text-base font-semibold">Kapota</p>
            <p className="text-xs text-white/55">Desktop messaging</p>
          </div>
        </div>

        <div className="grid aspect-[16/10] w-full grid-cols-[34%_1fr] overflow-hidden rounded-app border border-white/10 bg-[#f4f7f5] shadow-2xl">
          <div className="border-r border-[#dbe3df] bg-white p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#19241f]">Chats</span>
              <MessageCircle className="size-4 text-[#66756e]" />
            </div>
            <div className="mb-3 h-7 rounded-control bg-[#eff3f1]" />
            {["Maya", "Design team", "Arun", "Weekend plans"].map((name, index) => (
              <div key={name} className={`flex items-center gap-2 border-b border-[#edf1ef] py-2 ${index === 0 ? "bg-[#e1f7ef]" : ""}`}>
                <span className={`size-7 shrink-0 rounded-full ${["bg-[#ef8f74]", "bg-[#5e8fca]", "bg-[#d6ad54]", "bg-[#8c78b9]"][index]}`} />
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-semibold text-[#19241f]">{name}</span>
                  <span className="mt-1 block h-1.5 w-16 rounded-full bg-[#dce4e0]" />
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col bg-[#eef2f0]">
            <div className="flex h-11 items-center gap-2 border-b border-[#dbe3df] bg-white px-3">
              <span className="size-7 rounded-full bg-[#ef8f74]" />
              <span className="text-[10px] font-semibold text-[#19241f]">Maya</span>
              <span className="ml-auto size-1.5 rounded-full bg-[#16a34a]" />
            </div>
            <div className="flex flex-1 flex-col justify-end gap-2 p-4">
              <div className="max-w-[70%] rounded-app rounded-bl-[2px] bg-white px-3 py-2 text-[10px] text-[#27352f] shadow-sm">
                Glad you made it. How is the new project going?
              </div>
              <div className="ml-auto max-w-[74%] rounded-app rounded-br-[2px] bg-[#d9f8eb] px-3 py-2 text-[10px] text-[#27352f] shadow-sm">
                Really well. I will send you the latest screen today.
                <CheckCheck className="ml-auto mt-1 size-3 text-[#00866a]" />
              </div>
            </div>
            <div className="m-3 h-8 rounded-control border border-[#dbe3df] bg-white" />
          </div>
        </div>

        <h2 className="mt-9 text-2xl font-semibold">{title}</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">{subtitle}</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-white/55">
          <LockKeyhole className="size-4" />
          Private conversations, connected across your devices
        </div>
      </div>
    </aside>
  );
};

export default AuthImagePattern;
