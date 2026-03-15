import type { EngineSlug } from "../../services/funkhub";
import psychIcon from "../../../styles/assets/engine_psych.png";
import basegameIcon from "../../../styles/assets/engine_basegame.png";
import codenameIcon from "../../../styles/assets/engine_codename.png";
import fpsPlusIcon from "../../../styles/assets/engine_fps_plus.png";
import jsEngineIcon from "../../../styles/assets/engine_js_engine.png";
import alePsychIcon from "../../../styles/assets/engine_ale_psych.png";
import pSliceIcon from "../../../styles/assets/engine_p_slice.png";

const iconByEngine: Record<EngineSlug, string> = {
  psych: psychIcon,
  basegame: basegameIcon,
  codename: codenameIcon,
  "fps-plus": fpsPlusIcon,
  "js-engine": jsEngineIcon,
  "ale-psych": alePsychIcon,
  "p-slice": pSliceIcon,
};

export function getEngineIcon(slug: EngineSlug): string {
  return iconByEngine[slug];
}
