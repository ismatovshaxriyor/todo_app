# ========================
# 🎨 JAZZMIN CONFIG — Cook Service
# ========================

# JAZZMIN_UI_TWEAKS = {
#     "theme": "flatly",            # Bosh tema (Bootstrap varianti)
#     "navbar": "navbar-dark",      # Yuqori panel qoramtir
#     "sidebar": "dark",            # Chap menyu qoramtir
#     "dark_mode_theme": "slate",   # Tungi rejimda ishlatiladigan tema
#     "footer_fixed": True,
#     "actions_sticky_top": True,
# }

JAZZMIN_SETTINGS = {
    # --- Asosiy ma’lumotlar ---
    "site_title": "Todo Admin",
    "site_header": "Todo Management",
    "site_brand": "Todo App",
    "site_logo_classes": "img-circle shadow-sm",
    "welcome_sign": "Welcome to Todo Dashboard",
    "copyright": "© 2026 Todo App. All rights reserved.",
    "index_title": "Todo App boshqaruv paneli",

    # --- Qidiruv ---
    "search_model": [
        "users.User",
        "todo.Todo",
    ],

    # --- User avatar ---
    "user_avatar": None,

    # --- Yuqori menyu (header bar) ---
    "topmenu_links": [
        {"name": "Home", "url": "admin:index", "permissions": ["auth.view_user"]},
        {"name": "API Docs", "url": "/schema/", "new_window": True},
        {"model": "todo.Todo"},
    ],

    # --- User menyusi ---
    "usermenu_links": [
        {"model": "users.User"},
    ],

    # --- Sidebar menyu sozlamalari ---
    "show_sidebar": True,
    "navigation_expanded": True,
    "hide_apps": ["sessions", "admin", "contenttypes"],
    "hide_models": ["auth.Group"],
    "order_with_respect_to": ["users", "todo"],

    # --- Ikonalar ---
    "icons": {
        "users.User": "fas fa-users",
        "todo.Todo": "fas fa-tasks",
    },
    "default_icon_parents": "fas fa-folder",
    "default_icon_children": "fas fa-circle",

    # --- Modal o'rniga popup ishlatish ---
    "related_modal_active": False,

    # --- UI Tweaks ---
    "custom_css": None,
    "custom_js": None,
    "use_google_fonts_cdn": True,
    "show_ui_builder": True,

    # --- Forma tartibi ---
    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "users.user": "collapsible",
        "todo.todo": "vertical_tabs",
    },

    # --- Tema (bootstrap varianti) ---
    "theme": "darkly",
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-primary",
    "accent": "accent-primary",
    "navbar": "navbar-secondary navbar-dark",
    "no_navbar_border": False,
    "navbar_fixed": False,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": False,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "lumen",
    "dark_mode_theme": None,
    "button_classes": {
        "primary": "btn-outline-primary",
        "secondary": "btn-outline-secondary",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success"
    }
}