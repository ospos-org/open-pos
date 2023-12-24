import {DesktopNavigationElement} from "@components/common/desktopNavigationElement";
import {ContentSwitcher} from "@components/common/contentSwitcher";
import {MobileMenu} from "@components/common/mobileMenu";
import {MobileNavigationElement} from "@components/common/mobileNavigationElement";
import {useAtom} from "jotai/index";
import {mobileMenuOpenAtom} from "@atoms/openpos";
import {useWindowSize} from "@hooks/useWindowSize";

export function ContentPage() {
    const [ menuOpen, setMenuOpen ] = useAtom(mobileMenuOpenAtom);
    const windowSize = useWindowSize();

    return (
        <div>
            <div className="flex flex-row sm:h-[calc(100dvh-18px)] h-[calc(100dvh-58px)] flex-shrink-0">
                {/* Menu Selector */}
                <DesktopNavigationElement />

                {/* Content for Menu */}
                <ContentSwitcher />
            </div>

            <MobileMenu />

            {
                menuOpen && (windowSize.height ?? 0 <= 640) && (
                    <>
                        <div
                            onClick={() => { setMenuOpen(false) }}
                            className="bg-black h-[100vh] w-[100dw] min-h-[100vh] min-w-[100vw] top-0 fixed z-5 opacity-40"
                        >
                        </div>

                        <MobileNavigationElement />
                    </>
                )
            }
        </div>

    )
}