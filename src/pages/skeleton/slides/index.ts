import { setHeightOffset } from "@WebSlides/lib";
setHeightOffset(38); // need to update CSS too... (38/2)

import "@LISS/components/page/color-switch";
import "@LISS/components/code/code-script";

const menu = __LOAD_FILE__("/src/pages/content.txt");
import { initMenu } from "@LISS/components/page/menu/";

initMenu(menu);