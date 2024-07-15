function initializeMap() {
    console.log("script_map.js loaded"); // 调试输出
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;

    const svg = d3.select("#map-container").append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoMercator()
        .center([121.4737, 31.2304]) // 上海市中心
        .scale(30000)
        .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

     // 添加缩放功能
     const zoom = d3.zoom()
     .scaleExtent([1, 25]) // 缩放范围限制
     .on("zoom", zoomed);
 
     svg.call(zoom);
     
    function zoomed(event) {
        const { transform } = event;
        const scaleFactor = transform.k; // 缩放比例

        // 控制图片的最大宽度和高度
        const maxImageWidth = 5; // 设置最大宽度
        const maxImageHeight = 5; // 设置最大高度
        const maxImageFontSize = 1

        // 根据缩放比例动态显示或隐藏图片
        if (scaleFactor < 5) {
            svg.selectAll("image").style("display", "none");
            svg.selectAll("circle").style("display", "block")
                .attr("transform", transform)
                .attr("r", 5/ transform.k)
            svg.selectAll("text.image-info").style("display", "none")

                
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
            svg.selectAll("text.image-info").style("display", "block")
                .attr("transform", transform)
                .attr("font-size", d => {
                    const fontSize = 1 * transform.k
                    return fontSize > maxImageFontSize ? maxImageFontSize :fontSize;}) // 根据缩放比例调整字体大小
                .attr("fill", "black");
        }

        // 根据缩放比例计算线条的适当宽度
        const strokeWidth = 1 / scaleFactor;

        svg.selectAll("path")
            .attr("transform", transform)
            .attr("stroke-width", strokeWidth); // 设置线条宽度随着缩放比例变化
            
        svg.selectAll("text.area-info")
            .attr("transform", transform)
            .attr("font-size", d => 12 / transform.k); // 根据缩放比例调整字体大小
        
    }

    d3.json("https://geojson.cn/api/data/310000.json").then(function(geojson) {
        svg.append("g")
            .selectAll("path")
            .data(geojson.features)
            .enter().append("path")
            .attr("d", path)
            .attr("stroke", "#333")
            .attr("fill", "none");// 设置填充为透明

        d3.csv("data/datas.csv").then(function(data) {
            const groupedData = d3.group(data, d => d.名称);

            groupedData.forEach((points, name) => {
                const baseX = projection([points[0].lng, points[0].lat])[0];
                const baseY = projection([points[0].lng, points[0].lat])[1];
                const occupiedPositions = new Set();
                
                points.forEach((point, i) => {
                    let col = 0, row = 0, offsetX = 0, offsetY = 0;

                    // 确保图片不重叠
                    while (occupiedPositions.has(`${col}-${row}`)) {
                        col = (col + 1) % 3;
                        row = col === 0 ? row + 1 : row;
                        offsetX = col * 1; // 每列的水平偏移量，增大间距
                        offsetY = row * 1; // 每行的垂直偏移量，增大间距
                    }

                    occupiedPositions.add(`${col}-${row}`);
                
                    // 添加初始阶段的点
                    svg.append("circle")
                        .attr("cx", baseX + offsetX)
                        .attr("cy", baseY + offsetY)
                        .attr("r", 5)
                        .attr("fill", "black")
                        .style("display", "block");

                    let imageUrl = `images/${point.名称}.jpg`;
                    
                    const textDistance = 6
                    const lineSpacing = 1.5
                    const imageFontSize = 1
                    const image = new Image();
                    image.onload = function() {
                        svg.append("image")
                            .attr("xlink:href", imageUrl)
                            .attr("x", baseX + offsetX ) 
                            .attr("y", baseY + offsetY )//图片错位
                            .attr("width", 100) // 默认图片宽度
                            .attr("height", 100) // 默认图片高度
                            .style("display", "none");

                        
                        // 添加图片信息文本
                        const textGroup = svg.append("text")
                            .attr("class", "image-info")
                            .attr("x", baseX + offsetX + textDistance) // 在图片右侧略微偏移
                            .attr("y", baseY + offsetY-textDistance) // 与图片顶部对齐
                            .attr("font-size", imageFontSize)
                            .attr("fill", "#333")
                            .attr("dominant-baseline", "hanging") // 文字基线设置为 hanging
                            .style("display", "none");

                        textGroup.append("tspan")
                            .attr("x", baseX + offsetX + textDistance)
                            .attr("dy", lineSpacing)
                            .text(`名称：${point.名称}`);

                        textGroup.append("tspan")
                            .attr("x", baseX + offsetX +textDistance)
                            .attr("dy", lineSpacing)
                            .text(`时间：${point.建造时间}`);

                        textGroup.append("tspan")
                            .attr("x", baseX + offsetX + textDistance)
                            .attr("dy", lineSpacing)
                            .text(`来源：${point.来源}`);

                        textGroup.append("tspan")
                            .attr("x", baseX + offsetX + textDistance)
                            .attr("dy", lineSpacing)
                            .text(`展示形式：${point.展示形式}`);

                        textGroup.append("tspan")
                            .attr("x", baseX + offsetX + textDistance)
                            .attr("dy", lineSpacing)
                            .text(`描述：${point.描述}`);
                        };

                    image.onerror = function() {
                        imageUrl = `images/${point.名称}.png`;
                        const imagePng = new Image();
                        imagePng.onload = function() {
                            svg.append("image")
                                .attr("xlink:href", imageUrl)
                                .attr("x", baseX + offsetX ) 
                                .attr("y", baseY + offsetY -5)//图片错位
                                .attr("width", 100) // 默认图片宽度
                                .attr("height", 100) // 默认图片高度
                                .style("display", "none");

                        // 添加图片信息文本
                        const textGroup = svg.append("text")
                            .attr("class", "image-info")
                            .attr("x", baseX + offsetX + textDistance) // 在图片右侧略微偏移
                            .attr("y", baseY + offsetY-textDistance) // 与图片顶部对齐
                            .attr("font-size", imageFontSize)
                            .attr("fill", "#333")
                            .attr("dominant-baseline", "hanging")
                            .style("display", "none"); // 文字基线设置为 hanging

                        textGroup.append("tspan")
                            .attr("x", baseX + offsetX + textDistance)
                            .attr("dy", lineSpacing)
                            .text(`名称：${point.名称}`);

                        textGroup.append("tspan")
                            .attr("x", baseX + offsetX + textDistance)
                            .attr("dy", lineSpacing)
                            .text(`时间：${point.建造时间}`);

                        textGroup.append("tspan")
                            .attr("x", baseX + offsetX + textDistance)
                            .attr("dy", lineSpacing)
                            .text(`来源：${point.来源}`);

                        textGroup.append("tspan")
                            .attr("x", baseX + offsetX + textDistance)
                            .attr("dy", lineSpacing)
                            .text(`展示形式：${point.展示形式}`);

                        textGroup.append("tspan")
                            .attr("x", baseX + offsetX + textDistance)
                            .attr("dy", lineSpacing)
                            .text(`描述：${point.描述}`);
                    };
                        imagePng.onerror = function() {
                            console.error(`Image not found: ${point.名称}`);
                        };
                        imagePng.src = imageUrl;
                    };
                    image.src = imageUrl;
                });
            });
        });
         // 添加区位名称文本
         svg.append("g")
         .selectAll("text")
         .data(geojson.features)
         .enter().append("text")
         .attr("class", "area-info")
         .text(d => d.properties.name) // 区位名称
         .attr("x", d => path.centroid(d)[0]) // 文本位置 x 坐标
         .attr("y", d => path.centroid(d)[1]) // 文本位置 y 坐标
         .attr("text-anchor", "middle") // 文本锚点居中对齐
         .attr("font-size", 12) // 初始字体大小
         .attr("fill", "#333"); // 字体颜色

         // 切换地图底图显示与隐藏
        const toggleMapButton = document.getElementById("toggleMapButton");
        let mapVisible = false; // 初始状态为显示地图

        toggleMapButton.addEventListener("click", function() {
            if (mapVisible) {
                svg.selectAll("path").style("display", "none");
                svg.selectAll("text").style("display", "none");
                mapVisible = false;
                toggleMapButton.textContent = "显示地图";
            } else {
                svg.selectAll("path").style("display", "block");
                svg.selectAll("text").style("display", "block");
                mapVisible = true;
                toggleMapButton.textContent = "隐藏地图";
            }
            // 窗口大小调整时更新地图和文本位置
        window.addEventListener("resize", function() {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight * 0.9;

            svg.attr("width", newWidth).attr("height", newHeight);

            projection.translate([newWidth / 2, newHeight / 2]);

            svg.selectAll("path").attr("d", path);

            svg.selectAll("image").each(function(d, i) {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const offsetX = col * 50;// 每列的水平偏移量，增大间距
                const offsetY = row * 50;// 每行的垂直偏移量，增大间距

                d3.select(this)
                    .attr("x", projection([d.lng, d.lat])[0] + offsetX - 50)
                    .attr("y", projection([d.lng, d.lat])[1] + offsetY - 50)
                    .attr("width", 30) // 确保图片大小恢复到初始尺寸
                    .attr("height", 30); // 确保图片大小恢复到初始尺寸;
            });

            svg.selectAll("text")
                .attr("x", d => path.centroid(d)[0])
                .attr("y", d => path.centroid(d)[1]);
        });
        });
    });
}

initializeMap(); // 直接调用初始化函数