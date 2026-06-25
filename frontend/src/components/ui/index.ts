/**
 * prince-ui Primitiv-Barrel für das-home.
 *
 * Zentrale Re-Export-Stelle für die in der Migration genutzten prince-ui-Komponenten.
 * Komponenten importieren von hier (`@/components/ui`) statt direkt von "prince-ui",
 * damit ein späterer Austausch/Wrapper an EINER Stelle passiert (Pattern aus tippspiel).
 */
export {
  Card,
  Button,
  Badge,
  KpiCard,
  Switch,
  TextField,
  Select,
  SelectItem,
  ComboBox,
  ComboBoxItem,
  Slider,
  Modal,
  Notice,
  Toolbar,
  Tabs,
  TabBar,
  Tab,
  TabPanel,
  Link,
  Tag,
} from "prince-ui";

export type {
  CardProps,
  ButtonProps,
  BadgeProps,
  BadgeTone,
  KpiCardProps,
  SwitchProps,
  TextFieldProps,
  SelectProps,
  SliderProps,
  ModalProps,
  NoticeProps,
} from "prince-ui";
