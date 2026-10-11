import { Doc, Frame, Group, Item, Variant } from "./tokens";
import { createDefaultLayer } from "./registry";

export type TemplateKey = "auth" | "dashboard" | "settings" | "ecommerce" | "pricing" | "chat";

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
  {
    key: "ecommerce",
    name: "E-Commerce Product",
    description: "Product showcase, -35% OFF badge, star rating, and vibrant Add-to-Cart CTA",
    icon: "shopping_cart",
  },
  {
    key: "pricing",
    name: "Pricing & Plans",
    description: "Tiered subscription cards with Pro highlighted gradient CTA",
    icon: "payments",
  },
  {
    key: "chat",
    name: "Messenger Chat",
    description: "Conversation thread with avatar header, message bubbles, and send action",
    icon: "chat",
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

  if (key === "ecommerce") {
    const frame: Frame = {
      id: frameId,
      name: "Product Detail",
      x: startX,
      y: startY,
      note: "E-Commerce high-converting product showcase screen",
    };

    const breadcrumbItem: Item = {
      id: uid("item"),
      kind: "shadcnBreadcrumb",
      label: "Breadcrumb",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Breadcrumb"),
    };

    const saleBadge: Item = {
      id: uid("item"),
      kind: "shadcnBadge",
      label: "-35% OFF SALE",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Badge", { variant: "destructive", children: "-35% OFF SALE" }),
    };

    const ratingBadge: Item = {
      id: uid("item"),
      kind: "shadcnBadge",
      label: "★★★★★ 4.9 (1.2k)",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Badge", { variant: "secondary", children: "★★★★★ 4.9 (1.2k)" }),
    };

    const productTitle: Item = {
      id: uid("item"),
      kind: "text",
      label: "Pro Wireless ANC Headphones",
      bold: true,
      size: 24,
      icon: null,
      variant: "filled",
    };

    const productDesc: Item = {
      id: uid("item"),
      kind: "text",
      label: "Spatial audio with dynamic head tracking & 40h battery.",
      size: 13,
      icon: null,
      variant: "filled",
    };

    const priceText: Item = {
      id: uid("item"),
      kind: "text",
      label: "$199.00  (was $299.00)",
      bold: true,
      size: 20,
      icon: null,
      variant: "filled",
    };

    const addToCartBtn: Item = {
      id: uid("item"),
      kind: "shadcnButton",
      label: "🛒 Thêm vào giỏ hàng",
      icon: null,
      variant: "filled",
      action: { to: "Đã thêm Pro Wireless Headphones vào giỏ hàng!", transition: "none", type: "toast" },
      layer: createDefaultLayer("Button", { variant: "success", children: "🛒 Thêm vào giỏ hàng" }),
    };

    const buyNowBtn: Item = {
      id: uid("item"),
      kind: "shadcnButton",
      label: "⚡ Mua ngay với 1-Click",
      icon: null,
      variant: "filled",
      action: { to: "Đang mở cổng thanh toán bảo mật...", transition: "none", type: "toast" },
      layer: createDefaultLayer("Button", { variant: "gradient", children: "⚡ Mua ngay với 1-Click" }),
    };

    const groups: Group[] = [
      { id: uid("g"), x: startX + 24, y: startY + 60, axis: "x", items: [breadcrumbItem] },
      { id: uid("g"), x: startX + 24, y: startY + 110, axis: "x", items: [saleBadge, ratingBadge] },
      { id: uid("g"), x: startX + 24, y: startY + 160, axis: "y", items: [productTitle, productDesc] },
      { id: uid("g"), x: startX + 24, y: startY + 240, axis: "x", items: [priceText] },
      { id: uid("g"), x: startX + 24, y: startY + 300, axis: "x", items: [addToCartBtn] },
      { id: uid("g"), x: startX + 24, y: startY + 360, axis: "x", items: [buyNowBtn] },
    ];

    return { frame, groups };
  }

  if (key === "pricing") {
    const frame: Frame = {
      id: frameId,
      name: "Pricing Plans",
      x: startX,
      y: startY,
      note: "SaaS tiered subscription plans and pricing table",
    };

    const headerTitle: Item = {
      id: uid("item"),
      kind: "text",
      label: "Choose Your Plan",
      bold: true,
      size: 24,
      icon: null,
      variant: "filled",
    };

    const headerDesc: Item = {
      id: uid("item"),
      kind: "text",
      label: "Unlock unlimited power for your entire design team.",
      size: 13,
      icon: null,
      variant: "filled",
    };

    const freeCardLayer = createDefaultLayer("Card");
    freeCardLayer.children = [
      {
        id: uid("layer"),
        type: "CardHeader",
        props: {},
        children: [
          { id: uid("layer"), type: "CardTitle", props: {}, children: "Starter Free" },
          { id: uid("layer"), type: "CardDescription", props: {}, children: "$0 / month • Basic tools" },
        ],
      },
    ];

    const freeCard: Item = {
      id: uid("item"),
      kind: "shadcnCard",
      label: "Starter Free",
      icon: null,
      variant: "filled",
      layer: freeCardLayer,
    };

    const freeBtn: Item = {
      id: uid("item"),
      kind: "shadcnButton",
      label: "Bắt đầu miễn phí",
      icon: null,
      variant: "filled",
      action: { to: "Đã kích hoạt gói Starter miễn phí!", transition: "none", type: "toast" },
      layer: createDefaultLayer("Button", { variant: "outline", children: "Bắt đầu miễn phí" }),
    };

    const proCardLayer = createDefaultLayer("Card");
    proCardLayer.children = [
      {
        id: uid("layer"),
        type: "CardHeader",
        props: {},
        children: [
          { id: uid("layer"), type: "Badge", props: { variant: "default" }, children: "MOST POPULAR" },
          { id: uid("layer"), type: "CardTitle", props: {}, children: "Pro Plan" },
          { id: uid("layer"), type: "CardDescription", props: {}, children: "$29 / month • Unlimited ProMax tools" },
        ],
      },
    ];

    const proCard: Item = {
      id: uid("item"),
      kind: "shadcnCard",
      label: "Pro Plan",
      icon: null,
      variant: "filled",
      layer: proCardLayer,
    };

    const proBtn: Item = {
      id: uid("item"),
      kind: "shadcnButton",
      label: "✨ Nâng cấp lên Pro",
      icon: null,
      variant: "filled",
      action: { to: "Chào mừng bạn đến với gói ProMax!", transition: "none", type: "toast" },
      layer: createDefaultLayer("Button", { variant: "gradient", children: "✨ Nâng cấp lên Pro" }),
    };

    const groups: Group[] = [
      { id: uid("g"), x: startX + 24, y: startY + 60, axis: "y", items: [headerTitle, headerDesc] },
      { id: uid("g"), x: startX + 24, y: startY + 140, axis: "x", items: [freeCard] },
      { id: uid("g"), x: startX + 44, y: startY + 230, axis: "x", items: [freeBtn] },
      { id: uid("g"), x: startX + 24, y: startY + 300, axis: "x", items: [proCard] },
      { id: uid("g"), x: startX + 44, y: startY + 410, axis: "x", items: [proBtn] },
    ];

    return { frame, groups };
  }

  if (key === "chat") {
    const frame: Frame = {
      id: frameId,
      name: "Messenger Chat",
      x: startX,
      y: startY,
      note: "Live chat conversation and messaging thread",
    };

    const avatarItem: Item = {
      id: uid("item"),
      kind: "shadcnAvatar",
      label: "Sarah Connor",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Avatar"),
    };

    const chatHeader: Item = {
      id: uid("item"),
      kind: "text",
      label: "Sarah Connor (Active now)",
      bold: true,
      size: 16,
      icon: null,
      variant: "filled",
    };

    const incomingBubble: Item = {
      id: uid("item"),
      kind: "shadcnCard",
      label: "Incoming message",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Card", {
        className: "bg-muted text-muted-foreground p-3 rounded-2xl max-w-[280px]",
        children: "Hey! Can you send over the updated design specs?",
      }),
    };

    const outgoingBubble: Item = {
      id: uid("item"),
      kind: "shadcnCard",
      label: "Outgoing message",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Card", {
        className: "bg-primary text-primary-foreground p-3 rounded-2xl max-w-[280px]",
        children: "Sure! Just finalized the shadcn/ui vibrant buttons.",
      }),
    };

    const inputMsg: Item = {
      id: uid("item"),
      kind: "shadcnInput",
      label: "Nhập tin nhắn...",
      icon: null,
      variant: "filled",
      layer: createDefaultLayer("Input", { placeholder: "Nhập tin nhắn..." }),
    };

    const sendBtn: Item = {
      id: uid("item"),
      kind: "shadcnButton",
      label: "Gửi",
      icon: null,
      variant: "filled",
      action: { to: "Tin nhắn đã được gửi thành công!", transition: "none", type: "toast" },
      layer: createDefaultLayer("Button", { variant: "gradient", children: "Gửi" }),
    };

    const groups: Group[] = [
      { id: uid("g"), x: startX + 24, y: startY + 60, axis: "x", items: [avatarItem, chatHeader] },
      { id: uid("g"), x: startX + 24, y: startY + 130, axis: "x", items: [incomingBubble] },
      { id: uid("g"), x: startX + 60, y: startY + 220, axis: "x", items: [outgoingBubble] },
      { id: uid("g"), x: startX + 24, y: startY + 340, axis: "x", items: [inputMsg, sendBtn] },
    ];

    return { frame, groups };
  }

  // settings (default / fallback)
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
