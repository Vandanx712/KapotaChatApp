import { MessageCircle, ShieldCheck } from "lucide-react";
import Logo from "./common/Logo";

function NoChatSelected() {
    return (
        <section className="chat-canvas hidden min-w-0 flex-1 flex-col items-center justify-center p-16 lg:flex">
            <div className="max-w-md text-center">
                <div className="mx-auto flex items-center justify-center">
                    <Logo size={72} />
                </div>
                <h1 className="mt-5 text-2xl font-semibold text-ink">Kapota for Web</h1>
                <p className="mt-3 text-sm leading-6 text-muted">
                    Choose a conversation to continue messaging, or start a new chat from the left panel.
                </p>
                <div className="mt-7 flex items-center justify-center gap-2 text-xs font-medium text-subtle">
                    <ShieldCheck className="size-4" />
                    Your private conversations stay connected across devices
                </div>
                <MessageCircle className="sr-only" />
            </div>
        </section>
    );
}

export default NoChatSelected;
