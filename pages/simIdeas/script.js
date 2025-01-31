document.addEventListener('DOMContentLoaded', function() {
    const margin = { top: 20, right: 30, bottom: 150, left: 30 }; // 调整边距以容纳更多文本
    const width = 1500 - margin.left - margin.right; // 增大宽度
    const height = 800 - margin.top - margin.bottom; // 增大高度

    const x = d3.scaleBand().range([0, width]).padding(0.1);
    const y = d3.scaleBand().range([height, 0]).padding(0.1);

    const svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const xAxis = svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .attr("class", "x-axis");

    const yAxis = svg.append("g")
        .attr("class", "y-axis");

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    d3.csv("data.csv").then(data => {
        const themes = data.map(d => d.标题);
        const categories = ["自然", "经济", "社会", "政治", "文化", "图", "文", "物", "场", "演", "媒", "事", "业"];

        // 计算每个分类下每个具体内容的出现次数
        const countData = {};
        categories.forEach(category => {
            countData[category] = {};
        });

        data.forEach(d => {
            categories.forEach(category => {
                if (d[category]) {
                    if (!countData[category][d[category]]) {
                        countData[category][d[category]] = 0;
                    }
                    countData[category][d[category]]++;
                }
            });
        });

        // 根据出现次数计算点的半径范围
        const radiusScale = d3.scaleLinear()
            .domain([1, d3.max(Object.values(countData).map(obj => d3.max(Object.values(obj))))])
            .range([3, 8]);

        x.domain(themes);
        y.domain(categories);


        function updateFontSize() {
            const fontSize = Math.max(6, Math.min(8, width / themes.length)); // 根据宽度调整字体大小

            xAxis.call(d3.axisBottom(x))
                .selectAll("text")
                .style("font-size", fontSize + "px")
                .attr("transform", "rotate(-65)")// 旋转文字以避免重叠
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .on("mouseover", function(event, d) {
                    const dataItem = data.find(item => item.标题 === d);
                    if (dataItem) {
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", .9);
                        tooltip.html(`<strong>${d}:</strong> ${dataItem.描述}`);
                        
                        const tooltipWidth = tooltip.node().getBoundingClientRect().width;
                
                        tooltip.style("left", () => {
                            if (event.pageX + tooltipWidth > window.innerWidth) {
                                return (event.pageX - tooltipWidth - 5) + "px"; // 向左移动tooltip
                            }
                            return (event.pageX + 5) + "px"; // 向右移动tooltip
                        })
                        .style("top", (event.pageY - 28) + "px");
                
                        // 设置占位符图像
                        d3.select("#image-container")
                            .style("display", "block")
                            .select("img")
                            .attr("src", "data:image/svg+xml;base64," + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300"><rect width="300" height="300" style="fill:black;"/></svg>'));
                
                        // 尝试使用jpg和png后缀加载图片
                        const imageUrlJpg = `images/${d}.jpg`;
                        const imageUrlPng = `images/${d}.png`;
                
                        // 创建一个新的Image对象用于加载图片
                        const image = new Image();
                        image.onload = function() {
                            d3.select("#image-container img").attr("src", imageUrlJpg);
                        };
                        image.onerror = function() {
                            const fallbackImage = new Image();
                            fallbackImage.onload = function() {
                                d3.select("#image-container img").attr("src", imageUrlPng);
                            };
                            fallbackImage.onerror = function() {
                                // 占位符图像已经设置，不需要再做处理
                            };
                            fallbackImage.src = imageUrlPng;
                        };
                        image.src = imageUrlJpg;
                
                        console.log(`Trying to load image: ${imageUrlJpg} or ${imageUrlPng}`); // 调试输出
                    }
                })
                .on("mouseout", function(event, d) {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                
                    // 隐藏图片
                    d3.select("#image-container")
                        .style("display", "none");
                });

            yAxis.call(d3.axisLeft(y))
                .selectAll("text")
                .style("font-size", fontSize + "px");
        }

        updateFontSize();


        // 隐藏轴本身
        xAxis.selectAll("path").remove();
        yAxis.selectAll("path").remove();

        // 绘制垂直网格线
        svg.selectAll(".vertical-line")
            .data(themes)
            .enter().append("line")
            .attr("class", "vertical-line")
            .attr("x1", d => x(d) + x.bandwidth() / 2)
            .attr("x2", d => x(d) + x.bandwidth() / 2)
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "2,2");

        // 绘制水平网格线
        svg.selectAll(".horizontal-line")
            .data(categories)
            .enter().append("line")
            .attr("class", "horizontal-line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", d => y(d) + y.bandwidth() / 2)
            .attr("y2", d => y(d) + y.bandwidth() / 2)
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "2,2");

        svg.selectAll(".dot")
            .data(data)
            .enter().append("g")
            .selectAll(".dot")
            .data(d => categories.map(category => ({ theme: d.标题, category, value: d[category], description: d.描述 })))
            .enter().filter(d => d.value)
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d.theme) + x.bandwidth() / 2)
            .attr("cy", d => y(d.category) + y.bandwidth() / 2)
            .attr("r", d => radiusScale(countData[d.category][d.value]))
            .attr("fill", "black") // 初始颜色设置为黑色
            .on("mouseover", function(event, d) {
                d3.select(this).attr("r", radiusScale(countData[d.category][d.value]) * 1.5).attr("fill", "orange");
                // 获取具有相同分类的标题
                const relatedTitles = data.filter(item => item[d.category] === d.value).map(item => item.标题);

                 // 高亮显示所有相关的标题
                svg.selectAll(".x-axis text")
                    .filter(function(theme) { return relatedTitles.includes(theme); })
                    .classed("highlighted", true);

                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);

                tooltip.html(
                    `<strong>>>></strong> ${d.value}<br>
                    <strong>相关点子:</strong> ${relatedTitles.join("   ||   ")}`
                )
                
                const tooltipWidth = tooltip.node().getBoundingClientRect().width;

                tooltip.style("left", () => {
                    if (event.pageX + tooltipWidth > window.innerWidth) {
                        return (event.pageX - tooltipWidth - 5) + "px"; // 左弹出tooltip
                    }
                    return (event.pageX + 5) + "px";//右弹出tooltip
                })
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("r", radiusScale(countData[d.category][d.value])).attr("fill", "grey"); // 点击后变为灰色
               
                // 取消高亮显示
                svg.selectAll(".x-axis text")
                   .classed("highlighted", false);
                
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })
            .on("click", function(event, d) {
                const relatedTitles = data.filter(item => item[d.category] === d.value).map(item => item.标题);

                // 清空图片容器
                const imageGridContainer = d3.select("#image-grid-container");
                imageGridContainer.html(""); // 清空之前的图片
                imageGridContainer.style("display", "grid");

               // 添加相关图片到容器
               relatedTitles.forEach(title => {
                const imageUrl = `images/${title}.jpg`;
                const imageGridItem = imageGridContainer.append("div")
                    .attr("class", "image-grid-item");
                
                imageGridItem.append("img")
                    .attr("src", imageUrl)
                    .on("error", function() {
                        // 如果图片加载失败，显示黑色方块
                        d3.select(this)
                            .attr("src", "")
                            .style("background-color", "black")
                            .style("width", "100px")
                            .style("height", "150px");
                    });

                imageGridItem.append("div")
                    .attr("class", "title")
                    .text(title);
            });


                // 调整图片容器的位置
                const containerWidth = imageGridContainer.node().getBoundingClientRect().width;
                const containerHeight = imageGridContainer.node().getBoundingClientRect().height;
                imageGridContainer.style("top", `${(window.innerHeight - containerHeight) / 2}px`)
                    .style("left", `${(window.innerWidth - containerWidth) / 2}px`)
                    .style("transform", "translate(-50%, -50%)"); // 始终保持居中
            });
    });
 });



function saveSVG() {
    const svgElement = document.querySelector("svg"); // 获取SVG元素

    // 创建一个新的Blob对象，包含SVG的XML数据
    const svgBlob = new Blob([svgElement.outerHTML], { type: "image/svg+xml;charset=utf-8" });

    // 创建一个下载链接
    const svgURL = URL.createObjectURL(svgBlob);

    // 创建一个<a>元素，并设置它的属性
    const downloadLink = document.createElement("a");
    downloadLink.href = svgURL;
    downloadLink.download = "chart.svg"; // 下载文件的默认名称

    // 将<a>元素添加到文档中，并模拟点击下载
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // 清理创建的URL对象
    URL.revokeObjectURL(svgURL);
    document.body.removeChild(downloadLink);
}

function updateImageContainerPosition() {
    const imageContainer = document.querySelector("#image-container");
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const containerHeight = imageContainer.offsetHeight;
    const containerWidth = imageContainer.offsetWidth;

    const top = (windowHeight - containerHeight) / 2;
    const left = (windowWidth - containerWidth) / 2;

    imageContainer.style.top = `${top}px`;
    imageContainer.style.left = `${left}px`;
}

// 在窗口大小变化时调用函数更新位置
window.addEventListener("resize", updateImageContainerPosition);

// 添加搜索框事件监听
const searchBox = document.getElementById('search-box');
searchBox.addEventListener('input', function() {
    const query = this.value.toLowerCase();

    svg.selectAll(".x-axis text")
        .classed("highlighted", function(d) {
            return d.toLowerCase().includes(query);
        });

    const matchedItem = data.find(item => item.标题.toLowerCase().includes(query));
    if (matchedItem) {
        const imageUrl = `images/${matchedItem.标题}.jpg`;
        d3.select("#image-container")
            .style("display", "block")
            .select("img")
            .attr("src", imageUrl);
    } else {
        d3.select("#image-container")
            .style("display", "none");
    }
});