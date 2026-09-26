import { createApp } from "vue";
import VicDashboard from "./VicDashboard.vue";

// Mounts the Vue app into the given wrapper element. Returns the app
// instance so the caller (vic_dashboard.js) can hold a reference, e.g.
// to unmount it or call exposed methods later.
function setup_vue(wrapper) {
	const app = createApp(VicDashboard);
	app.mount(wrapper.get(0));
	return app;
}

frappe.ui.setup_vue = setup_vue;
export default setup_vue;
