// interact with this variable from a javascript console
var pc_progressive;

function main() {
    // load csv file and create the chart
    d3.csv('data/odi-cw-1.csv', function(data) {
        var colorgen = d3.scale.category20();
        var colors = {};
        _(data).chain()
            .pluck('Agency Name')
            .uniq()
            .each(function(d,i) {
                colors[d] = colorgen(i);
            });

        var _data = data;

        _(data).each(function (d) {
            delete d['Business Case ID'];
            delete d['Agency Code'];
        });

        var color = function(d) { return colors[d["Agency Name"]]; };

        var width = $('#parcoord-chart').width(),
            height = 7/16*$('#parcoord-chart').width();

        $('#parcoord').css('height', height + 'px');
        $('.jsgrid-grid-body').css('height', height + 'px');

        pc_progressive = d3.parcoords()("#parcoord")
            .data(data)
            .hideAxis(['Project ID', 'Cost Variance (%)', 'Schedule Variance (%)'])
            .color(color)
            .alpha(0.4)
            .width(width)
            .height(height)
            .margin({ top: 24, left: 150, bottom: 12, right: 0 })
            .mode("queue")
            .render()
            .reorderable()
            .brushable()  // enable brushing
            .interactive();  // command line mode

        updateGrid(data);

        pc_progressive.on("brush", function(d) {
            updateGrid(d);
        });

        $("#jsGrid").on({
            mouseenter: function(){
                var d = $(this).data("JSGridItem");
                if (d) pc_progressive.highlight([d]);
            },
            mouseleave: function(){
                pc_progressive.unhighlight();
            }
        }, "tr");

        function updateGrid(d) {
            $("#jsGrid").jsGrid({
                width: "100%",
                height: "400px",

                inserting: false,
                editing: false,
                sorting: true,
                paging: true,

                data: d,

                fields: [
                    { name: "Agency Name", type: "text", width: 75 },

                    { name: "Project ID", type: "text", width: 50 },
                    { name: "Project Name", type: "text", width: 75 },
                    { name: "Project Description", type: "text", width: 150 },

                    { name: "Planned Cost ($ M)", type: "number", width: 60 },
                    { name: "Projected/Actual Cost ($ M)", headerTemplate: "Projected or Actual Cost ($ M)", type: "number", width: 70 },
                    { name: "Cost Variance ($ M)", type: "number", width: 50, align: "left" },
                    { name: "Cost Variance (%)", type: "number", width: 50, align: "left"  },
                    { name: "Lifecycle Cost", headerTemplate:"Lifecycle Cost ($ M)", type: "number", width: 60 },

                    { name: "Start Date", type: "date", width: 50 },
                    { name: "Updated DateTime", headerTemplate:"Updated Date", type: "date", width: 50 },
                    { name: "Planned Project Completion Date (B2)", headerTemplate:"Planned Completion Date (B2)", type: "date", width: 50 },
                    { name: "Projected/Actual Project Completion Date (B2)", headerTemplate:"Projected or Actual Completion Date (B2)", type: "date", width: 50 },
                    { name: "Project Completion Date (B1)", headerTemplate:"Completion Date (B1)", type: "date", width: 50 },
                    { name: "Schedule Variance (in days)", headerTemplate: "Schedule Variance (days)", type: "number", width: 50 },
                    { name: "Schedule Variance (%)", type: "number", width: 50 },
                ]
            });
        }


    });
}

main();

window.addEventListener("resize", function () {
    $("#parcoord").empty();
    main();
});

// defining date filed for jsgrid
var MyDateField = function(config) {
    jsGrid.Field.call(this, config);
};

MyDateField.prototype = new jsGrid.Field({

    css: "date-field",            // redefine general property 'css'
    align: "center",              // redefine general property 'align'

    myCustomProperty: "foo",      // custom property

    sorter: function(date1, date2) {
        return new Date(date1) - new Date(date2);
    },

    itemTemplate: function(value) {
        var date = new Date(value);
        return date && !isNaN(date.getTime())? date.toDateString() : "Unknown";
    }
});

jsGrid.fields.date = MyDateField;