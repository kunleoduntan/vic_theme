<script>
export default {
	name: "VicDashboard",
	data() {
		return {
			occupancyFilter: "all",
			statusFilter: "all",
			rooms: [
				{ number: "1", building: "Main", floor: 1, type: "Comfort", occupancy: "Vacant", status: "out_of_order" },
				{ number: "4", building: "Main", floor: 1, type: "STD", occupancy: "Vacant", status: "out_of_order" },
				{ number: "7", building: "Main", floor: 1, type: "STD", occupancy: "Vacant", status: "out_of_order" },
				{ number: "9", building: "Main", floor: 1, type: "Deluxe", occupancy: "Occupied", status: "dirty" },
				{ number: "12", building: "Main", floor: 2, type: "STD", occupancy: "Vacant", status: "clean" },
				{ number: "14", building: "Main", floor: 2, type: "Comfort", occupancy: "Vacant", status: "inspected" },
			],
		};
	},
	computed: {
		occupancyStats() {
			return [
				{ label: "Vacant", value: this.rooms.filter((r) => r.occupancy === "Vacant").length, max: this.rooms.length },
				{ label: "Occupied", value: this.rooms.filter((r) => r.occupancy === "Occupied").length, max: this.rooms.length },
			];
		},
		statusStats() {
			const counts = { dirty: 0, clean: 0, inspected: 0, out_of_order: 0 };
			this.rooms.forEach((r) => counts[r.status]++);
			return [
				{ key: "dirty", label: "Dirty", value: counts.dirty },
				{ key: "clean", label: "Clean", value: counts.clean },
				{ key: "inspected", label: "Inspected", value: counts.inspected },
				{ key: "out_of_order", label: "Out of order", value: counts.out_of_order },
			];
		},
		filteredRooms() {
			return this.rooms.filter((r) => {
				const occMatch = this.occupancyFilter === "all" || r.occupancy === this.occupancyFilter;
				const statusMatch = this.statusFilter === "all" || r.status === this.statusFilter;
				return occMatch && statusMatch;
			});
		},
	},
	methods: {
		pct(stat) {
			return Math.round((stat.value / stat.max) * 100) + "%";
		},
		setStatusFilter(key) {
			this.statusFilter = this.statusFilter === key ? "all" : key;
		},
		statusLabel(status) {
			return { dirty: "Dirty", clean: "Clean", inspected: "Inspected", out_of_order: "Out of order" }[status];
		},
		statusIndicatorClass(status) {
			return { dirty: "red", clean: "green", inspected: "blue", out_of_order: "orange" }[status];
		},
		// Example of using Frappe's JS API from inside the Vue component —
		// this is the whole point of building the page this way rather than
		// as a plain HTML/JS page: frappe.call, frappe.db, frappe.route_options
		// etc. are all available here, same as in any other Desk script.
		async refresh() {
			// frappe.call({ method: "vic_theme.api.get_rooms" }).then(r => this.rooms = r.message)
			frappe.show_alert({ message: "Refreshed (demo data — wire this up to a real frappe.call)", indicator: "green" });
		},
	},
};
</script>

<template>
	<div style="padding: 20px;">
		<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
			<h2 style="margin:0;">Housekeeping</h2>
			<span class="btn btn-default" @click="refresh">Refresh</span>
		</div>

		<div style="display:flex; gap:16px; margin-bottom:20px; flex-wrap:wrap;">
			<div class="form-section" style="flex:1; min-width:220px; padding:16px;">
				<div style="font-weight:600; margin-bottom:10px;">Room occupancy</div>
				<div v-for="stat in occupancyStats" :key="stat.label" style="margin-bottom:10px;">
					<div style="display:flex; justify-content:space-between; font-size:13px;">
						<span>{{ stat.label }}</span><strong>{{ stat.value }}</strong>
					</div>
					<div class="vic-stat-bar"><span :style="{ width: pct(stat) }"></span></div>
				</div>
			</div>

			<div class="form-section" style="flex:1; min-width:220px; padding:16px;">
				<div style="font-weight:600; margin-bottom:10px;">Room status</div>
				<div
					v-for="stat in statusStats"
					:key="stat.key"
					class="vic-pill"
					:class="{ active: statusFilter === stat.key }"
					style="display:flex; justify-content:space-between; width:100%; margin-bottom:6px; box-sizing:border-box;"
					@click="setStatusFilter(stat.key)"
				>
					<span>{{ stat.label }}</span><strong>{{ stat.value }}</strong>
				</div>
			</div>
		</div>

		<div style="margin-bottom:14px;">
			<span
				v-for="opt in ['all', 'Vacant', 'Occupied']"
				:key="opt"
				class="vic-pill"
				:class="{ active: occupancyFilter === opt }"
				style="margin-right:8px;"
				@click="occupancyFilter = opt"
			>{{ opt === 'all' ? 'All rooms' : opt }}</span>
		</div>

		<table style="width:100%; border-collapse:collapse;">
			<thead>
				<tr class="list-row-head" style="text-align:left;">
					<th style="padding:8px;">Room</th>
					<th style="padding:8px;">Building</th>
					<th style="padding:8px;">Floor</th>
					<th style="padding:8px;">Type</th>
					<th style="padding:8px;">Occupancy</th>
					<th style="padding:8px;">Status</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="room in filteredRooms" :key="room.number" class="list-row">
					<td style="padding:8px;">{{ room.number }}</td>
					<td style="padding:8px;">{{ room.building }}</td>
					<td style="padding:8px;">{{ room.floor }}</td>
					<td style="padding:8px;">{{ room.type }}</td>
					<td style="padding:8px;">{{ room.occupancy }}</td>
					<td style="padding:8px;">
						<span class="indicator-pill" :class="statusIndicatorClass(room.status)">
							{{ statusLabel(room.status) }}
						</span>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
