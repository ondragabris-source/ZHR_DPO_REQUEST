sap.ui.define([
	"ZHR_DPO_REQUEST/lib/controller/Base.controller",
	"ZHR_DPO_REQUEST/lib/utils/Formatter"
], function (
	Controller,
	Formatter
) {
	"use strict";

	return Controller.extend("ZHR_DPO_REQUEST.lib.controller.Detail", {
		oFormatter: Formatter,
		onInit: function () {

			this.getRouter()
				.getRoute("detail")
				.attachMatched(this._handleRouteMatchedDetail, this);
			
			this.getEventBus().subscribe("refreshDataDetail", this.refreshDataDetail, this);
		},
	});
});