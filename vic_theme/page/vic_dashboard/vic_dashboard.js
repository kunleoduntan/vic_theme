/* VIC Dashboard — Page controller.
 * The actual UI lives in ../../public/js/vic_dashboard/VicDashboard.vue,
 * compiled by `bench build` into vic_dashboard.bundle.js. This file just
 * creates the Page shell and lazy-loads that bundle, per Frappe's
 * documented pattern for Vue-in-Desk (docs.frappe.io/framework/
 * using-vue-inside-a-desk-page) — the same approach for v14/v15/v16.
 */

frappe.pages["vic-dashboard"].on_page_load = function (wrapper) {
	const page = frappe.ui.make_app_page({
		parent: wrapper,
		title: "VIC Dashboard",
		single_column: true,
	});

	// Hot reload the Vue app on save while `bench` is running in developer
	// mode — convenient while iterating on VicDashboard.vue.
	if (frappe.boot.developer_mode) {
		frappe.hot_update = frappe.hot_update || [];
		frappe.hot_update.push(() => load_vue(wrapper));
	}
};

frappe.pages["vic-dashboard"].on_page_show = (wrapper) => load_vue(wrapper);

async function load_vue(wrapper) {
	const $parent = $(wrapper).find(".layout-main-section");
	$parent.empty();

	await frappe.require("vic_dashboard.bundle.js");
	frappe.vic_dashboard_app = frappe.ui.setup_vue($parent);
}
