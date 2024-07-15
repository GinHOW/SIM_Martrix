function initializeGridSortedImages() {
    const mapContainer = document.getElementById("map-container");
    const width = document.documentElement.clientWidth;
    const height = document.documentElement.clientHeight;

    mapContainer.innerHTML = "";

    const svg = d3.select("#map-container").append("svg")
        .attr("width", width)
        .attr("height", height);

    d3.csv("data/datas.csv").then(function(data) {
        data.sort((a, b) => new Date(a.建造时间) - new Date(b.建造时间));

        const cols = Math.floor(width / 160);  // 每行图片数量，根据窗口宽度动态调整
        const imageWidth = width / cols - 20;  // 图片宽度
        const imageHeight = imageWidth;  // 图片高度，保持正方形
        const textHeight = 120;  // 文字信息区域高度

        data.forEach((d, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;

            let imageUrl = `images/${d.名称}.jpg`;

            const image = new Image();
            image.onload = function() {
                appendImageAndText(svg, imageUrl, col, row, imageWidth, imageHeight, textHeight, d);
            };

            image.onerror = function() {
                imageUrl = `images/${d.名称}.png`;
                const imagePng = new Image();
                imagePng.onload = function() {
                    appendImageAndText(svg, imageUrl, col, row, imageWidth, imageHeight, textHeight, d);
                };
                imagePng.onerror = function() {
                    // 如果png也加载失败，使用黑色方块
                    appendImageAndText(svg, null, col, row, imageWidth, imageHeight, textHeight, d, true);
                };
                imagePng.src = imageUrl;
            };
            image.src = imageUrl;
        });
    }).catch(function(error) {
        console.error("Failed to load CSV data:", error);
    });
}

function appendImageAndText(svg, imageUrl, col, row, imageWidth, imageHeight, textHeight, data, useFallback = false) {
    const x = col * (imageWidth + 20) + 10;
    const y = row * (imageHeight + textHeight + 20) + 10;

    if (useFallback) {
        // 添加黑色方块
        svg.append("rect")
            .attr("x", x)
            .attr("y", y)
            .attr("width", imageWidth)
            .attr("height", imageHeight)
            .attr("fill", "black");
    } else {
        // 添加图片
        svg.append("image")
            .attr("xlink:href", imageUrl)
            .attr("x", x)
            .attr("y", y)
            .attr("width", imageWidth)
            .attr("height", imageHeight);
    }

    // 添加文字信息
    const textGroup = svg.append("g");

    textGroup.append("text")
        .attr("x", x + imageWidth / 2)
        .attr("y", y + imageHeight + 25)
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .text(data.名称);

    textGroup.append("text")
        .attr("x", x + imageWidth / 2)
        .attr("y", y + imageHeight + 45)
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .text(data.建造时间);

    textGroup.append("text")
        .attr("x", x + imageWidth / 2)
        .attr("y", y + imageHeight + 65)
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .text(data.来源);

    textGroup.append("text")
        .attr("x", x + imageWidth / 2)
        .attr("y", y + imageHeight + 85)
        .style("font-size", "12px")
        .style("text-anchor", "middle")
        .text(data.展示形式);

    // textGroup.append("foreignObject")
    //     .attr("x", x)
    //     .attr("y", y + imageHeight + 105)
    //     .attr("width", imageWidth)
    //     .attr("height", textHeight)
    //     .append("xhtml:div")
    //     .style("font-size", "12px")
    //     .style("text-align", "center")
    //     .style("width", imageWidth + "px")
    //     .style("height", textHeight + "px")
    //     .style("overflow", "hidden")
    //     .style("white-space", "normal")
    //     .html(data.描述);
}

initializeGridSortedImages();