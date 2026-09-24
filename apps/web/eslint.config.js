import { allowInlineStyles, forbidInlineStyles, ignores, react } from "@monedin/config/eslint";

export default [
  ignores,
  ...react,
  forbidInlineStyles,

  allowInlineStyles([
    "src/ui/ProgressBar.tsx",

    "src/features/landing/Orbits.tsx",

    "src/features/uploads/ImageUploadField.tsx",

    "src/ui/Spotlight.tsx",
  ]),

  {
    files: [
      "src/ui/**/*.{ts,tsx}",
      "src/ui-catalog.tsx",
      "src/app/Sidebar.tsx",
      "src/features/children/ChildrenPicker.tsx",
    ],
    rules: { "react-refresh/only-export-components": "off" },
  },
];
