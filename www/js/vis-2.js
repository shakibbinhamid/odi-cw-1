// /**
//  * Created by shakib on 01/03/17.
//  */
// var margin = {top: 30, right: 10, bottom: 10, left: 10},
//     width = 960 - margin.left - margin.right,
//     height = 500 - margin.top - margin.bottom;
//
// var x = d3.scale.ordinal().rangePoints([0, width], 1),
//     y = {},
//     dragging = {};
//
// var line = d3.svg.line(),
//     axis = d3.svg.axis().orient("left"),
//     background,
//     foreground;
//
// var svg = d3.select("#parcoord").append("svg")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//     .append("g")
//     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
// d3.csv("data/cars.csv", function(error, cars) {
//
//     // Extract the list of dimensions and create a scale for each.
//     x.domain(dimensions = d3.keys(cars[0]).filter(function(d) {
//         return d != "name" && (y[d] = d3.scale.linear()
//                 .domain(d3.extent(cars, function(p) { return +p[d]; }))
//                 .range([height, 0]));
//     }));
//
//     console.log(dimensions)
//
//     // Add grey background lines for context.
//     background = svg.append("g")
//         .attr("class", "background")
//         .selectAll("path")
//         .data(cars)
//         .enter().append("path")
//         .attr("d", path);
//
//     // Add blue foreground lines for focus.
//     foreground = svg.append("g")
//         .attr("class", "foreground")
//         .selectAll("path")
//         .data(cars)
//         .enter().append("path")
//         .attr("d", path);
//
//     // Add a group element for each dimension.
//     var g = svg.selectAll(".dimension")
//         .data(dimensions)
//         .enter().append("g")
//         .attr("class", "dimension")
//         .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
//         .call(d3.behavior.drag()
//             .origin(function(d) { return {x: x(d)}; })
//             .on("dragstart", function(d) {
//                 dragging[d] = x(d);
//                 background.attr("visibility", "hidden");
//             })
//             .on("drag", function(d) {
//                 dragging[d] = Math.min(width, Math.max(0, d3.event.x));
//                 foreground.attr("d", path);
//                 dimensions.sort(function(a, b) { return position(a) - position(b); });
//                 x.domain(dimensions);
//                 g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
//             })
//             .on("dragend", function(d) {
//                 delete dragging[d];
//                 transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
//                 transition(foreground).attr("d", path);
//                 background
//                     .attr("d", path)
//                     .transition()
//                     .delay(500)
//                     .duration(0)
//                     .attr("visibility", null);
//             }));
//
//     // Add an axis and title.
//     g.append("g")
//         .attr("class", "axis")
//         .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
//         .append("text")
//         .style("text-anchor", "middle")
//         .attr("y", -9)
//         .text(function(d) { return d; });
//
//     // Add and store a brush for each axis.
//     g.append("g")
//         .attr("class", "brush")
//         .each(function(d) {
//             d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
//         })
//         .selectAll("rect")
//         .attr("x", -8)
//         .attr("width", 16);
// });
//
// function position(d) {
//     var v = dragging[d];
//     return v == null ? x(d) : v;
// }
//
// function transition(g) {
//     return g.transition().duration(500);
// }
//
// // Returns the path for a given data point.
// function path(d) {
//     return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
// }
//
// function brushstart() {
//     d3.event.sourceEvent.stopPropagation();
// }
//
// // Handles a brush event, toggling the display of foreground lines.
// function brush() {
//     var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
//         extents = actives.map(function(p) { return y[p].brush.extent(); });
//     foreground.style("display", function(d) {
//         return actives.every(function(p, i) {
//             return extents[i][0] <= d[p] && d[p] <= extents[i][1];
//         }) ? null : "none";
//     });
// }

// ---------------------------------------------------------------------------------------------------------------------

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
            delete d['Cost Variance (%)'];
            delete d['Schedule Variance (%)'];
        });

        var color = function(d) { return colors[d["Agency Name"]]; };

        var width = $('#parcoord-chart').width(),
            height = 9/16*$('#parcoord-chart').width();

        $('#parcoord-1').css('height', height + 'px');

        pc_progressive = d3.parcoords()("#parcoord-1")
            .data(data)
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

        // setting up grid
        var column_keys = d3.keys(data[0]);
        var columns = column_keys.map(function(key,i) {
            return {
                id: key,
                name: key,
                field: key,
                sortable: true
            }
        });

        var options = {
            enableCellNavigation: true,
            enableColumnReorder: false,
            multiColumnSort: false
        };

        var dataView = new Slick.Data.DataView();
        var grid = new Slick.Grid("#grid", dataView, columns, options);
        var pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));

        // wire up model events to drive the grid
        dataView.onRowCountChanged.subscribe(function (e, args) {
            grid.updateRowCount();
            grid.render();
        });

        dataView.onRowsChanged.subscribe(function (e, args) {
            grid.invalidateRows(args.rows);
            grid.render();
        });

        // column sorting
        var sortcol = column_keys[0];
        var sortdir = 1;

        function comparer(a, b) {
            var x = a[sortcol], y = b[sortcol];
            return (x == y ? 0 : (x > y ? 1 : -1));
        }

        // click header to sort grid column
        grid.onSort.subscribe(function (e, args) {
            sortdir = args.sortAsc ? 1 : -1;
            sortcol = args.sortCol.field;

            if ($.browser.msie && $.browser.version <= 8) {
                dataView.fastSort(sortcol, args.sortAsc);
            } else {
                dataView.sort(comparer, args.sortAsc);
            }
        });

        // highlight row in chart
        grid.onMouseEnter.subscribe(function(e,args) {
            // Get row number from grid
            var grid_row = grid.getCellFromEvent(e).row;

            // Get the id of the item referenced in grid_row
            var item_id = grid.getDataItem(grid_row).id;
            var d = pc_progressive.brushed() || data;

            // Get the element position of the id in the data object
            elementPos = d.map(function(x) {return x.id; }).indexOf(item_id);

            // Highlight that element in the parallel coordinates graph
            pc_progressive.highlight([d[elementPos]]);
        });

        grid.onMouseLeave.subscribe(function(e,args) {
            pc_progressive.unhighlight();
        });

        console.log(_data)


        // fill grid with data
        gridUpdate(data);

        // update grid on brush
        pc_progressive.on("brush", function(d) {
            gridUpdate(d);
        });

        function gridUpdate(data) {
            dataView.beginUpdate();
            dataView.setItems(data, 'Project ID');
            dataView.endUpdate();
        };


    });
}

main();


window.addEventListener("resize", function () {
    $("#parcoord-1").empty();
    main();
});