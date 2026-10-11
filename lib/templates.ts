import { Doc, Frame, Group, Item, Variant } from "./tokens";
import { createDefaultLayer } from "./registry";

export type TemplateKey = "auth" | "dashboard" | "settings";

export interface TemplateInfo {
  key: TemplateKey;
  name: string;
  description: string;
  icon: string;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    key: "auth",
    name: "Authentication (Login)",
    description: "Login card with email, password, remember me, and sign-in button",
    icon: "lock",
  },
  {
    key: "dashboard",
    name: "Dashboard Overview",
    description: "Breadcrumb navigation, metric cards, download button, and data table",
    icon: "dashboard",
  },
  {
    key: "settings",
    name: "User Settings",
    description: "Profile avatar, user inputs, preference toggles, and save action",
    icon: "settings",
  },
];

function uid(prefix = "tpl"): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

export function createTemplateScreen(
  key: TemplateKey,
  startX = 0,
  startY = 0
): { frame: Frame; groups: Group[] } {
  const frameId = uid("frame");

  if (key === "auth") {
    const frame: Frame = {
      id: frameId,
      name: "Login",
      x: startX,
      y: startY,
      note: "Authentication screen for existing users",
    };

    const cardLayer = createDefaultLayer("Card");
    cardLayer.children = [
      {
        id: uid("layer"),
        name: "CardHeader",
        type: "CardHeader",
        props: {},
        children: [
          {
            id: uid("layer"),
            name: "CardTitle",
            type: "CardTitle",
            props: {},
            children: "Welcome back",
          },
          {
            id: uid("layer"),
            name: "CardDescription",
            type: "CardDescription",
            props: {},
            children: "Enter your credentials to sign in to your account",
          },
        ],
      },
    ];

    const cardItem: Item = {
      id: uid("item"),
      kind: "shadcnCard",
      label: "Welcome back",
      icon: null,
      variant: "filled",
      layer: cardLayer,
    };

    const emailItem: Item = {
      id: uid("item"),
      kind: "shadcnInput",
      label: "name@example.com",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Input", {
        type: "email",
        placeholder: "name@example.com",
      }),
    };

    const passwordItem: Item = {
      id: uid("item"),
      kind: "shadcnInput",
      label: "Password",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Input", {
        type: "password",
        placeholder: "••••••••",
      }),
    };

    const rememberItem: Item = {
      id: uid("item"),
      kind: "shadcnCheckbox",
      label: "Remember me for 30 days",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Checkbox", {
        defaultChecked: true,
      }),
    };

    const submitBtn: Item = {
      id: uid("item"),
      kind: "shadcnButton",
      label: "Sign In",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Button", {
        variant: "default",
      }),
    };

    const groups: Group[] = [
      { id: uid("g"), x: startX + 24, y: startY + 80, axis: "x", items: [cardItem] },
      { id: uid("g"), x: startX + 24, y: startY + 220, axis: "x", items: [emailItem] },
      { id: uid("g"), x: startX + 24, y: startY + 280, axis: "x", items: [passwordItem] },
      { id: uid("g"), x: startX + 24, y: startY + 340, axis: "x", items: [rememberItem] },
      { id: uid("g"), x: startX + 24, y: startY + 390, axis: "x", items: [submitBtn] },
    ];

    return { frame, groups };
  }

  if (key === "dashboard") {
    const frame: Frame = {
      id: frameId,
      name: "Dashboard",
      x: startX,
      y: startY,
      note: "Analytics overview and transaction records",
    };

    const breadcrumbItem: Item = {
      id: uid("item"),
      kind: "shadcnBreadcrumb",
      label: "",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Breadcrumb"),
    };

    const card1Layer = createDefaultLayer("Card");
    card1Layer.children = [
      {
        id: uid("layer"),
        name: "CardHeader",
        type: "CardHeader",
        props: {},
        children: [
          {
            id: uid("layer"),
            name: "CardTitle",
            type: "CardTitle",
            props: {},
            children: "Total Revenue",
          },
          {
            id: uid("layer"),
            name: "CardDescription",
            type: "CardDescription",
            props: {},
            children: "$45,231.89 (+20.1% this month)",
          },
        ],
      },
    ];

    const card1Item: Item = {
      id: uid("item"),
      kind: "shadcnCard",
      label: "Total Revenue",
      icon: null,
      variant: "filled",
      layer: card1Layer,
    };

    const tableItem: Item = {
      id: uid("item"),
      kind: "shadcnTable",
      label: "Transactions",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Table"),
    };

    const groups: Group[] = [
      { id: uid("g"), x: startX + 24, y: startY + 60, axis: "x", items: [breadcrumbItem] },
      { id: uid("g"), x: startX + 24, y: startY + 110, axis: "x", items: [card1Item] },
      { id: uid("g"), x: startX + 24, y: startY + 280, axis: "x", items: [tableItem] },
    ];

    return { frame, groups };
  }

  // settings
  const frame: Frame = {
    id: frameId,
    name: "Settings",
    x: startX,
    y: startY,
    note: "Profile details and notification preferences",
  };

  const avatarItem: Item = {
    id: uid("item"),
    kind: "shadcnAvatar",
    label: "JD",
    icon: null,
    variant: "filled",
    layer: createDefaultLayer("Avatar"),
  };

  const nameItem: Item = {
    id: uid("item"),
    kind: "shadcnInput",
    label: "Full Name",
    icon: null,
    variant: "filled",
    layer: createDefaultLayer("Input", { placeholder: "John Doe" }),
  };

  const switchItem: Item = {
    id: uid("item"),
    kind: "shadcnSwitch",
    label: "Email Notifications",
    icon: null,
    variant: "filled",
    layer: createDefaultLayer("Switch", { defaultChecked: true }),
  };

  const saveBtn: Item = {
    id: uid("item"),
    kind: "shadcnButton",
    label: "Save Changes",
    icon: null,
    variant: "filled",
    layer: createDefaultLayer("Button", { variant: "default" }),
  };

  const groups: Group[] = [
    { id: uid("g"), x: startX + 24, y: startY + 70, axis: "x", items: [avatarItem] },
    { id: uid("g"), x: startX + 24, y: startY + 140, axis: "x", items: [nameItem] },
    { id: uid("g"), x: startX + 24, y: startY + 200, axis: "x", items: [switchItem] },
    { id: uid("g"), x: startX + 24, y: startY + 260, axis: "x", items: [saveBtn] },
  ];

  return { frame, groups };
}
