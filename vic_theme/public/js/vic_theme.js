/* VIC THEME — switcher, page-menu integration, and List View extras.
 *
 * - vic_theme.THEMES: 12 palettes (5 original + 7 adapted from the
 *   smm_virtual theme registry, translated into the --vic-* variables
 *   vic_theme.css already defines).
 * - A colored dot in the navbar (quick access) and a "🎨 VIC Theme" item
 *   under every page's standard "•••" menu (forms AND list views) both
 *   open the same theme-picker dialog. The "•••" injection uses only
 *   public APIs (page.add_menu_item) via cur_frm/cur_list — the
 *   supported way to reach it without touching Frappe internals — but
 *   isn't guaranteed for every page type across every version; the
 *   navbar dot is the reliable fallback everywhere.
 * - Choice is stored in localStorage (per browser), same as before.
 * - vic_theme.export_current_listview(): generic "export what's on
 *   screen" for the active List View, via vic_theme.api.export_listview_excel
 *   on the server — works for any doctype, no per-doctype setup needed.
 * - vic_theme.render_summary_cards(): opt-in helper if you want the
 *   Pack-Profile-style stat cards above a specific doctype's list view;
 *   this needs doctype-specific data, so it isn't auto-injected everywhere.
 */

frappe.provide("vic_theme");

vic_theme.THEMES = [
	{ key: "violet", label: "Violet (Default)", color: "#6c5ce7", icon: "🔮" },
	{ key: "farepoint", label: "FarePoint", color: "#e91e8c", icon: "✈️" },
	{ key: "emerald", label: "Emerald", color: "#0f766e", icon: "💎" },
	{ key: "sunset", label: "Sunset", color: "#d97706", icon: "🌅" },
	{ key: "ocean", label: "Ocean", color: "#2563eb", icon: "🌊" },
	{ key: "nova", label: "Nova", color: "#7c3aed", icon: "🌟" },
	{ key: "ember", label: "Ember", color: "#f97316", icon: "🔥" },
	{ key: "midnight", label: "Midnight", color: "#818cf8", icon: "🌙" },
	{ key: "verdant", label: "Verdant", color: "#059669", icon: "🌿" },
	{ key: "arctic", label: "Arctic", color: "#0284c7", icon: "❄️" },
	{ key: "forest", label: "Forest", color: "#22c55e", icon: "🌲" },
	{ key: "candy", label: "Candy", color: "#db2777", icon: "🍬" },
];

vic_theme.STORAGE_KEY = "vic_theme_preset";

vic_theme.apply = function (key) {
	if (!vic_theme.THEMES.find((t) => t.key === key)) key = "violet";
	document.documentElement.setAttribute("data-vic-theme", key);
	localStorage.setItem(vic_theme.STORAGE_KEY, key);
};

vic_theme.get_current = function () {
	return localStorage.getItem(vic_theme.STORAGE_KEY) || "violet";
};

/* -------------------------------------------------------------------------
   Theme picker — a proper dialog with a grid of cards (icon, name, a
   strip of the theme's own semantic colors, a checkmark on the active
   one), rather than a small dropdown. Opened from the navbar dot and
   from the "🎨 VIC Theme" item under each page's "•••" menu.
   ------------------------------------------------------------------------- */
vic_theme.open_picker = function () {
	const current = vic_theme.get_current();

	const cards_html = vic_theme.THEMES.map((t) => {
		const is_active = t.key === current;
		return `
			<div class="vic-picker-card ${is_active ? "active" : ""}" data-key="${t.key}"
				style="border-color:${is_active ? t.color : "var(--vic-border)"};">
				<div class="vic-picker-icon" style="background:${t.color}22;">${t.icon}</div>
				<div class="vic-picker-info">
					<div class="vic-picker-name">${frappe.utils.escape_html(t.label)}</div>
					<div class="vic-picker-swatch" style="background:${t.color};"></div>
				</div>
				${is_active ? `<span class="vic-picker-check" style="color:${t.color};">&#10003;</span>` : ""}
			</div>
		`;
	}).join("");

	const dialog = new frappe.ui.Dialog({
		title: __("🎨 VIC Theme"),
		size: "large",
		fields: [
			{
				fieldtype: "HTML",
				fieldname: "vic_theme_grid",
				options: `
					<p style="font-size:12px;color:var(--vic-text-muted);margin:0 0 14px;">
						${__("Applies instantly across forms and list views. Stored in your browser only.")}
					</p>
					<div class="vic-picker-grid">${cards_html}</div>
				`,
			},
		],
	});

	dialog.$wrapper.find(".vic-picker-card").on("click", function () {
		const key = $(this).data("key");
		vic_theme.apply(key);
		dialog.hide();
		frappe.show_alert({ message: __("Theme changed"), indicator: "green" });
	});

	dialog.show();
};

/* -------------------------------------------------------------------------
   Navbar dot — quick access to the same picker dialog
   ------------------------------------------------------------------------- */
vic_theme.init_switcher = function () {
	if ($(".vic-theme-switcher").length) return; // already injected

	let $wrapper = $('<div class="vic-theme-switcher"></div>');
	let $dot = $('<div class="vic-theme-dot" title="Change theme"></div>');
	$wrapper.append($dot);
	$dot.on("click", (e) => {
		e.stopPropagation();
		vic_theme.open_picker();
	});

	// Try the standard navbar right-hand icon area; fall back to appending
	// to the navbar itself if the selector differs across versions.
	let $target = $(".navbar-right, .navbar .dropdown-help").first();
	if ($target.length) {
		$target.prepend($wrapper);
	} else {
		$(".navbar").append($wrapper);
	}

	vic_theme.apply(vic_theme.get_current());
};

/* -------------------------------------------------------------------------
   "•••" page-menu integration — adds "🎨 VIC Theme" to every Form's and
   List View's standard menu, and "📊 Export to Excel" to List Views only.
   Uses only the public page.add_menu_item API via cur_frm/cur_list,
   re-checked on route change since those globals swap as you navigate.
   ------------------------------------------------------------------------- */
vic_theme.inject_menu_items = function () {
	const targets = [];
	if (window.cur_frm && cur_frm.page) targets.push({ page: cur_frm.page, is_list: false });
	if (window.cur_list && cur_list.page) targets.push({ page: cur_list.page, is_list: true });

	targets.forEach(({ page, is_list }) => {
		if (page.__vic_theme_menu_added) return;
		page.add_menu_item(__("🎨 VIC Theme"), () => vic_theme.open_picker(), true);
		if (is_list) {
			page.add_menu_item(__("📊 Export to Excel"), () => vic_theme.export_current_listview(), true);
		}
		page.__vic_theme_menu_added = true;
	});
};

$(document).on("page-change", vic_theme.inject_menu_items);
if (frappe.router && frappe.router.on) {
	frappe.router.on("change", () => setTimeout(vic_theme.inject_menu_items, 300));
}

/* -------------------------------------------------------------------------
   Generic "export what's on screen" for the active List View — works for
   any doctype, using its currently visible columns and applied filters.
   ------------------------------------------------------------------------- */
vic_theme.export_current_listview = function () {
	const listview = window.cur_list;
	if (!listview) {
		frappe.show_alert({ message: __("Open a list view first"), indicator: "orange" });
		return;
	}

	const doctype = listview.doctype;

	let fields = [];
	try {
		fields = (listview.columns || []).map((c) => c.df && c.df.fieldname).filter(Boolean);
	} catch (e) {
		fields = [];
	}

	let filters = [];
	try {
		filters = listview.filter_area ? listview.filter_area.get() : [];
	} catch (e) {
		filters = [];
	}

	const accent =
		getComputedStyle(document.documentElement).getPropertyValue("--vic-accent").trim() || "#6c5ce7";

	const url =
		"/api/method/vic_theme.api.export_listview_excel" +
		"?doctype=" + encodeURIComponent(doctype) +
		"&filters=" + encodeURIComponent(JSON.stringify(filters)) +
		"&fields=" + encodeURIComponent(JSON.stringify(fields)) +
		"&accent_color=" + encodeURIComponent(accent);

	window.open(url, "_blank");
};

/* -------------------------------------------------------------------------
   Opt-in Pack-Profile-style summary cards for a specific doctype's list
   view. Not auto-injected anywhere — card content is domain-specific, so
   call this from that doctype's own frappe.listview_settings.onload, e.g.:
   vic_theme.render_summary_cards(listview, [
     { label: "Total Invoices", value: 132 },
     { label: "Paid", value: 84, variant: "success" },
     { label: "Unpaid", value: 30, variant: "danger" },
   ]);
   ------------------------------------------------------------------------- */
vic_theme.render_summary_cards = function (listview, cards) {
	const $page_content = listview.page.wrapper.find(".page-content");
	if (!$page_content.length) return;
	$page_content.find(".vic-summary-row").remove();

	const cards_html = cards
		.map(
			(c) => `
			<div class="vic-summary-card ${c.variant || ""}" data-key="${c.key || ""}">
				<div class="vic-summary-card-label">${frappe.utils.escape_html(c.label)}</div>
				<div class="vic-summary-card-value">${frappe.utils.escape_html(String(c.value))}</div>
			</div>
		`
		)
		.join("");

	$page_content.prepend(`<div class="vic-summary-row">${cards_html}</div>`);
};

$(document).on("app_ready", function () {
	vic_theme.init_switcher();
});

// Fallback for setups where app_ready has already fired by the time this loads
$(function () {
	setTimeout(() => {
		if (!$(".vic-theme-switcher").length) vic_theme.init_switcher();
	}, 1500);
});
