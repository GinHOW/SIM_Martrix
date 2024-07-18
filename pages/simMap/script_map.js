// 初始化地图
function initializeMap() {
    console.log("script_map.js loaded");
    
    // 设置边距和尺寸
    const margin = { left: 50, right: 50 };
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    
    // 创建SVG容器
    const svg = d3.select("#map-container").append("svg")
        .attr("width", width)
        .attr("height", height);

    // 设置地图投影
    const projection = d3.geoMercator()
        .center([121.4737, 31.2304])// 上海市中心
        .scale(30000)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // 添加缩放功能
    const zoom = d3.zoom()
        .scaleExtent([1, 25])
        .on("zoom", function(event) {
            zoomed(event, svg, margin,bezierLine, width); // 传递 svg 变量给 zoomed 函数
        });

    svg.call(zoom);

    svg.call(zoom);

    // 创建隐藏的浮动提示框
    const tooltip = createTooltip();

    // 贝塞尔曲线生成器
    const bezierLine = d3.line()
        .curve(d3.curveBasis)
        .x(d => d.x)
        .y(d => d.y);

    // 加载GeoJSON数据并绘制地图
    d3.json("https://geojson.cn/api/data/310000.json").then(function(geojson) {
        drawMap(svg, path, geojson);

        // 加载CSV数据并绘制数据点
        d3.csv("data/datas.csv").then(function(data) {
            const groupedData = d3.group(data, d => d.名称);
            processAndDrawData(svg, groupedData, projection, bezierLine, tooltip, margin, width, height);
        });
    });

    // 添加区位名称文本
    addAreaInfoText(svg, geojson.features, path);

    // 切换地图显示/隐藏
    addToggleMapButton(svg);

    // 窗口大小调整事件处理
    window.addEventListener("resize", () => handleResize(svg, projection, path));
}

//地图缩放功能
function zoomed(event,svg,margin,bezierLine, width) {
    const { transform } = event;
    const scaleFactor = transform.k; // 缩放比例

    // 控制图片的最大宽度和高度
    const maxImageWidth = 5; // 设置最大宽度
    const maxImageHeight = 5; // 设置最大高度
    const maxImageFontSize = 1

    // 根据缩放比例动态显示或隐藏图片
    if (scaleFactor < 2) {
        svg.selectAll("image").style("display", "none");
        svg.selectAll("circle").style("display", "block")
            .attr("transform", transform)
            .attr("r", 5/ transform.k)

        svg.selectAll("circle.label-end-point").style("display", "block")
            .attr("transform", transform)
            .attr("cx", d => transform.invertX(d.sideHorizontal === 'left' ? margin.left + d.estimatedWidth + 10 : width - margin.right - d.estimatedWidth - 10))
            .attr("cy", d => transform.invertY(d.labelY + 12))
            .attr("r", 5/ transform.k)   


        svg.selectAll("text.text-group").style("display", "none")
        svg.selectAll("text.point-name").style("display", "block")
            .attr("transform", transform)
            .attr("font-size", d => 12 / transform.k); // 根据缩放比例调整字体大小

        svg.selectAll("path.label-line").style("display", "block")
        d3.select("div.label-container").style("display", "block");


        svg.selectAll("text.label-text").style("display", "block")
            .attr("transform", transform)
            .attr("font-size", d => 12 / transform.k*2); // 根据缩放比例调整字体大小   
            
    } else {
        svg.selectAll("circle").style("display", "none");
        svg.selectAll("image").style("display", "block")
            .attr("transform", transform)
            .attr("width", d => {
                const width = 50 / transform.k;
                return width < maxImageWidth ? maxImageWidth : width;}) // 图片随缩放变化
            .attr("height", d => {
                const height = 50 / transform.k;
                return height < maxImageHeight ? maxImageHeight : height;
            })// 图片随缩放变化
            
        svg.selectAll("text.text-group").style("display", "block")
            .attr("transform", transform)
            .attr("font-size", d => {
                const fontSize = 1 * transform.k
                return fontSize > maxImageFontSize ? maxImageFontSize :fontSize;}) // 根据缩放比例调整字体大小
            .attr("fill", "black");

        svg.selectAll("text.point-name").style("display", "none");
        svg.selectAll("path.label-line").style("display", "none");
        d3.select("div.label-container").style("display", "none");
        d3.selectAll("circle.label-end-point").style("display", "none");

        


    }

    // 根据缩放比例计算线条的适当宽度
    const strokeWidth = 1 / scaleFactor;

    svg.selectAll("path")
        .attr("transform", transform)
        .attr("stroke-width", strokeWidth); // 设置线条宽度随着缩放比例变化
        
    svg.selectAll("text.area-info")
        .attr("transform", transform)
        .attr("font-size", d => 12 / transform.k); // 根据缩放比例调整字体大小

    

    // 更新贝塞尔曲线的路径
    svg.selectAll("path.label-line")
    .attr("transform", transform)
    .attr("d", d => {
        const relativeX = d.sideHorizontal === 'left' ? margin.left + d.estimatedWidth+10 : width - margin.right-d.estimatedWidth-10;
        const relativeY = d.labelY + 12;
        
        const svgX = transform.invertX(relativeX);
        const svgY = transform.invertY(relativeY);

        const startX = d.x; // 起点 x 坐标
        const startY = d.y; // 起点 y 坐标
        let endX, endY;

        // 根据文本的侧边确定终点 x 坐标
        if (d.sideHorizontal === 'left') {
            endX = svgX;
        } else {
            endX = svgX;
        }

        // 终点 y 坐标为文本的中心位置
        endY = svgY;

        // 构建贝塞尔曲线的路径字符串
        return bezierLine([
            { x: startX, y: startY },
            { x: d.sideHorizontal === 'left' ? endX + (startX - endX) / 2 : endX - (endX - startX) / 2, y: startY },
            { x: endX, y: endY }
        ]);
    });
}

// 创建隐藏的浮动提示框-提示框格式
function createTooltip() {
    return d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("text-align", "left")
        .style("width", "auto")
        .style("height", "auto")
        .style("padding", "5px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("background", "none")
        .style("border", "none")
        .style("display", "none");
}

// 绘制地图
function drawMap(svg, path, geojson) {
    svg.append("g")
        .selectAll("path")
        .data(geojson.features)
        .enter().append("path")
        .attr("d", path)
        .attr("stroke", "#333")
        .attr("fill", "none");
}

// 处理和绘制数据点
function processAndDrawData(svg, groupedData, projection, bezierLine, tooltip, margin, width, height) {
    let labels = [];
    // let leftLabels = [];
    // let rightLabels = [];

    groupedData.forEach((points, name) => {
        const baseX = projection([points[0].lng, points[0].lat])[0];
        const baseY = projection([points[0].lng, points[0].lat])[1];
        const occupiedPositions = new Set();

        points.forEach(point => {
            const { x, y, sideHorizontal, labelData } = calculatePointPosition(point, projection, width, height);
            labels.push(labelData);
            // updateLabelsData(labels,sideHorizontal,  leftLabels, rightLabels);
            addInitialPoint(svg, baseX, baseY);
            loadImage(svg, tooltip, point, baseX, baseY, occupiedPositions);
        });
    });
    const { leftLabels, rightLabels } = updateLabelsData(labels);
    adjustLabelPositions(leftLabels, rightLabels, height);
    addBezierLines(svg, leftLabels, rightLabels, bezierLine, margin, width);
    addLabels(svg, leftLabels, rightLabels, margin, width);
}

// 计算数据点位置
function calculatePointPosition(point, projection, width, height) {

    const [x, y] = projection([point.lng, point.lat]);
    const sideHorizontal = x < width / 1.99 ? 'left' : 'right';
    const sideVertical = y < height / 2 ? 'left' : 'right';//暂时没有用到 备用，用于划分垂直位置
    const labelData = {
        x: x,
        y: y,
        name: point.名称,
        sideHorizontal: sideHorizontal
    };
    return { x, y, sideHorizontal, sideVertical,labelData };
}


// 更新标签数据,更具位置划分两侧标签
function updateLabelsData(labels) {
    // 按照 x 坐标排序
    labels.sort((a, b) => a.x - b.x);

    const halfIndex = Math.floor(labels.length / 2);

    // 标记每个标签的 sideHorizontal
    labels.forEach((label, index) => {
        label.sideHorizontal = index < halfIndex ? 'left' : 'right';
    });

    // 将标签分成左右两部分
    leftLabels = labels.filter(label => label.sideHorizontal === 'left');
    rightLabels = labels.filter(label => label.sideHorizontal === 'right');

     // 按照 y 坐标对每个部分进行排序
     leftLabels = leftLabels.sort((a, b) => a.y - b.y);
     rightLabels = rightLabels.sort((a, b) => a.y - b.y);
     console.log(leftLabels)

    return { leftLabels, rightLabels };
 
    // if (label => label.sideHorizontal === 'left') {
    //     leftLabels.push(labels);
    // } else {
    //     rightLabels.push(labels);
    // }
    // console.log(leftLabels)
}

// 添加初始阶段的数据点-地图点位
function addInitialPoint(svg, baseX, baseY) {
    svg.append("circle")
        .attr("cx", baseX)
        .attr("cy", baseY)
        .attr("r", 5)
        .attr("fill", "black")
        .style("display", "block");
}

// 加载图像
function loadImage(svg, tooltip, point, baseX, baseY, occupiedPositions) {
    const texts = [
        `名称：${point.名称}`,
        `时间：${point.建造时间}`,
        `来源：${point.来源}`,
        `展示形式：${point.展示形式}`,
        `描述：${point.描述}`
    ];

    const loadImage = (url, onError) => {
        const image = new Image();
        image.onload = function() {
            svg.append("image")
                .attr("xlink:href", url)
                .attr("x", baseX)
                .attr("y", baseY)
                .attr("width", 100)
                .attr("height", 100)
                .style("display", "none")
                .on("mouseover", function(event) {
                    tooltip.style("display", "block")
                        .html(texts.join("<br>"))
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mousemove", function(event) {
                    tooltip.style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", function() {
                    tooltip.style("display", "none");
                });
        };
        image.onerror = onError;//利用回调函数，进行条件判断
        image.src = url;
    };

    const loadImageWithFallback = () => {
        loadImage(`images/${point.名称}.jpg`, () => {
            loadImage(`images/${point.名称}.png`, () => {
                console.error(`Image not found: ${point.名称}`);
            });
        });
    };

    loadImageWithFallback();
}

// 调整标签垂直位置
function adjustLabelPositions(leftLabels, rightLabels, height) {

     leftLabels.forEach((d, i) => {
        d.labelY = (height / (leftLabels.length + 1)) * (i + 1);
    });

    rightLabels.forEach((d, i) => {
        d.labelY = (height / (rightLabels.length + 1)) * (i + 1);
    });

    
}

// 添加贝塞尔曲线
function addBezierLines(svg, leftLabels, rightLabels, bezierLine, margin, width) {
    leftLabels.forEach(d => {
        const tempElement = d3.select("body").append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("font-size", "16px")
            .style("white-space", "nowrap")
            .text(d.name);

        d.estimatedWidth = tempElement.node().getBoundingClientRect().width;
        tempElement.remove();
    });

    rightLabels.forEach(d => {
        const tempElement = d3.select("body").append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("font-size", "16px")
            .style("white-space", "nowrap")
            .text(d.name);

        d.estimatedWidth = tempElement.node().getBoundingClientRect().width;
        tempElement.remove();
    });

    svg.append("g")
        .selectAll("path")
        .data(leftLabels.concat(rightLabels))
        .enter()
        .append("path")
        .attr("class", "label-line")
        .attr("id", (d, i) => "line-" + i)
        .attr("d", d => bezierLine([
            { x: d.x, y: d.y },
            { x: d.sideHorizontal === 'left' ? margin.left + (d.x - margin.left) / 2 : width - margin.right - (width - margin.right - d.x) / 2, y: d.y },
            { x: d.sideHorizontal === 'left' ? margin.left + d.estimatedWidth +10: width - margin.right-d.estimatedWidth-10, y: d.labelY+12}
        ]))
        .attr("stroke", "#333")
        .attr("stroke-width", 1)
        .attr("fill", "none")
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut);

    // 为每条贝塞尔曲线结束的位置添加点
    svg.append("g")
        .selectAll("circle")
        .data(leftLabels.concat(rightLabels))
        .enter()
        .append("circle")
        .attr("class", "label-end-point")
        .attr("cx", d => d.sideHorizontal === 'left' ? margin.left + d.estimatedWidth+10 : width - margin.right - d.estimatedWidth-10)
        .attr("cy", d => d.labelY + 12)
        .attr("r", 5)
        .attr("fill", "black")
        .style("display", "block");
}

// 添加标签
function addLabels(svg, leftLabels, rightLabels, margin, width) {
    leftLabels.forEach(d => {
        const tempElement = d3.select("body").append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("font-size", "16px")
            .style("white-space", "nowrap")
            .text(d.name);

        d.estimatedWidth = tempElement.node().getBoundingClientRect().width;
        tempElement.remove();
    });

    rightLabels.forEach(d => {
        const tempElement = d3.select("body").append("div")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("font-size", "16px")
            .style("white-space", "nowrap")
            .text(d.name);

        d.estimatedWidth = tempElement.node().getBoundingClientRect().width;
        tempElement.remove();
    });

    const labelContainer = d3.select("body").append("div")
        .attr("class", "label-container")
        .style("position", "absolute")
        .style("top", "0")
        .style("left", "0")
        .style("width", "100%")
        // .style("pointer-events", "none");

    labelContainer.selectAll("div.label-text")
        .data(leftLabels.concat(rightLabels))
        .enter()
        .append("div")
        .attr("class", "label-text")
        .attr("id", (d, i) => {
            const id = `label-${i}`;
            console.log(`Setting id for ${d.name}: ${id}`);
            return id;
        })
        .style("position", "absolute")
        .style("top", d => `${d.labelY}px`)
        .style("left", d => d.sideHorizontal === 'left' ? `${margin.left}px` : `${width - margin.right}px`)
        .style("text-align", d => d.sideHorizontal === 'left' ? "start" : "end")
        .style("transform", d => d.sideHorizontal === 'right' ? "translateX(-100%)" : null)
        .text(d => d.name)
        .each(function(d, i) {
            // 创建一个不可见的元素用于测量文本宽度
            const tempElement = d3.select("body").append("div")
                .style("position", "absolute")
                .style("visibility", "hidden")
                .style("font-size", "16px")
                .style("white-space", "nowrap")
                .text(d.name);
    
            const estimatedWidth = tempElement.node().getBoundingClientRect().width;
            tempElement.remove(); // 移除临时元素
    
            console.log(`Estimated width of "${d.name}": ${estimatedWidth}px`);
    
            // 在 .each 函数内设置 min-width
            d3.select(this).style("min-width", `${estimatedWidth}px`);
    
            // 添加鼠标悬停事件处理函数
            d3.select(this)
                .on("mouseover", function() {
                    d3.select(`#line-${i}`)
                        .attr("stroke", "#8e6c4f")
                        .attr("stroke-width", 2);
                    d3.select(this)
                        .attr("fill", "#8e6c4f");
                })
                .on("mouseout", function() {
                    d3.select(`#line-${i}`)
                        .attr("stroke", "#333")
                        .attr("stroke-width", 1);
                    d3.select(this)
                        .attr("fill", "black");
                });
        });
    }

//鼠标悬停事件
function handleMouseOver(d, i) {
    d3.select(this).attr("stroke", "#8e6c4f").attr("stroke-width", 2);
    d3.select("#label-" + i).attr("font-color", "#8e6c4f");
}
//鼠标取消悬停事件
function handleMouseOut(d, i) {
    d3.select(this).attr("stroke", "#333").attr("stroke-width", 1);
    d3.select("#label-" + i).attr("fill", "black");
}    

// 处理浏览器窗口大小调整
function handleResize(svg, projection, path) {
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;
    svg.attr("width", width)
    .attr("height", height);

    projection.translate([width / 2, height / 2]);

    svg.selectAll("path").attr("d", path);
    svg.selectAll("circle").attr("transform", d => `translate(${projection([d.lng, d.lat])})`);
    svg.selectAll("image").attr("transform", d => `translate(${projection([d.lng, d.lat])})`);
}

// 切换地图显示/隐藏
function addToggleMapButton(svg) {
    const toggleButton = d3.select("body").append("button")
    .attr("class", "toggle-map-button")
    .text("Toggle Map")
    .style("position", "absolute")
    .style("top", "10px")
    .style("right", "10px");
    toggleButton.on("click", function() {
        svg.selectAll("path").classed("hidden", function() {
            return !d3.select(this).classed("hidden");
        });
    });
}

// 添加区域名称文本
function addAreaInfoText(svg, features, path) {
svg.append("g")
.selectAll("text")
.data(features)
.enter().append("text")
.attr("x", d => path.centroid(d)[0])
.attr("y", d => path.centroid(d)[1])
.attr("text-anchor", "middle")
.attr("alignment-baseline", "middle")
.attr("fill", "#333")
.style("font-size", "10px")
.text(d => d.properties.name);
}

// 加载地图脚本
initializeMap();