import { currentUser } from "@clerk/nextjs/server";
import SidebarNav from "./SidebarNav";

const Menu = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata.role as string;
  const dashboardHref = role ? `/${role}` : "/";

  return <SidebarNav role={role} dashboardHref={dashboardHref} />;
};

export default Menu;
