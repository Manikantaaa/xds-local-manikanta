import { Link } from "lucide-react"

export const ContentSideBar = () => {
    return (
        <div className="faq_list">
            <h1 className="font-bold text-gray-900 header-font text_font_size"> Content </h1>
            <ul className="sidebar_list_gap mt-4">
                <li><Link href="/admin/faq" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">FAQs</Link></li>
                <li><Link href="/admin/advertisements" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 anchor_active">Advertisements</Link></li>
                <li><Link href="/admin/events" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Events</Link></li>
                <li><Link href="/admin/services" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Service Categories</Link></li>
                <li><Link href="/admin/articles" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Articles</Link></li>
                <li><Link href="/admin/notifications" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Notifications</Link></li>
                <li><Link href="/admin/platinum-partners" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Platinum Partners</Link></li>
            </ul>
        </div>
    )
}