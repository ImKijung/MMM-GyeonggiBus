/* Magic Mirror
 * Module: GyeonggiBus
 *
 * By Juil Kim
 * modified by KijungiM
 * MIT Licensed.
 */

Module.register("MMM-GyeonggiBus", {
    requiresVersion: "2.12.0",
    default: {
        apiBase: "http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute",
        serviceKey: "",
        stId: 119000011, //역정보
        busRouteId: 100100093, //버스 아이디
        header: "640번 버스 도착 정보",
        ord: 26, // 버스가 역에 도착하는 순서
        updateInterval: 1000 * 60 * 2, // refresh every 2 minutes, minimum 10 seconds
    },

    getStyles: function() {
        return ["MMM-GyeonggiBus.css"]
    },

    getHeader: function() {
        if (this.busInfo) {
            return "<i class='fa fa-fw fa-bus'></i> " + this.config.header;
        }
        return "<i class='fa fa-fw fa-bus'></i> 버스 정보";
    },

    start: function() {
        Log.info("11111 Starting module: " + this.name);
        this.busInfo = [];
        var self = this
        this.loaded = false;
        this.updateInterval = null;
    },

	getDom: function() {
		var wrapper = document.createElement("div");

        if (!this.loaded) {
            //wrapper.innerHTML = "Loading bus info...";
            return wrapper;
        }
        var busTable = document.createElement("table");
        busTable.className = "small";
        
        var row = document.createElement("tr");
        row.className = "title bright";
        busTable.appendChild(row);

        var busArrivalTime = document.createElement("td");
        busArrivalTime.className = "arriving";
        busArrivalTime.innerHTML = this.formatTime(this.busInfo.arrmsg1._text) + "<br/>" + this.formatTime(this.busInfo.arrmsg2._text);
        row.appendChild(busArrivalTime);

        wrapper.appendChild(busTable);
		return wrapper;
	},
    // 7분33초후[4번째 전]
    formatTime: function(timeText) {
        let match = timeText.match(/(\d+)분(\d+)초후/);
        if (match) {
            let minutes = parseInt(match[1]);
            let seconds = parseInt(match[2]);
            return `${minutes}분${seconds}초후${timeText.replace(match[0], "")}`;
        }
        return timeText;
    },

    updateTime: function() {
        if (this.busInfo && this.busInfo.arrmsg1 && this.busInfo.arrmsg2) {
            this.busInfo.arrmsg1._text = this.decrementTime(this.busInfo.arrmsg1._text);
            this.busInfo.arrmsg2._text = this.decrementTime(this.busInfo.arrmsg2._text);
            this.updateDom();
        }
    },

    decrementTime: function(timeText) {
        let match = timeText.match(/(\d+)분(\d+)초후/);
        if (match) {
            let minutes = parseInt(match[1]);
            let seconds = parseInt(match[2]);
            seconds--;
            if (seconds < 0) {
                seconds = 59;
                minutes--;
            }
            if (minutes < 0) {
                minutes = 0;
                seconds = 0;
            }
            return `${minutes}분${seconds}초후${timeText.replace(match[0], "")}`;
        }
        return timeText;
    },

    getBusInfo: function() {
        Log.info("Requesting bus info");
        this.sendSocketNotification("GET_BUS_DATA",
            {
                "config": this.config,
                "identifier": this.identifier
            }
        )
    },

	notificationReceived: function(notification, payload, sender){
        switch (notification) {
            case "DOM_OBJECTS_CREATED":
                this.getBusInfo();
                var busInfoTimer = setInterval(() => {
                    this.getBusInfo();
                }, this.config.updateInterval);
                
                var updateTimeTimer = setInterval(() => {
                    this.updateTime();
                }, 1000);

                break;
        }
	},

    socketNotificationReceived: function (notification, payload) {
        switch (notification) {
            case "BUS_DATA":
                this.loaded = true;
                console.log("NotificationReceived:" + notification);
                this.busInfo = payload;
                this.updateDom();
                break;
            case "BUS_DATA_ERROR":
                this.updateDom();
                break;
        }
    }
});
