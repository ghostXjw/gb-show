define(function(require, exports){
  const echarts = require('echarts')
  const d3 = require('d3')
  const $ = require('jquery')

  exports.sleep = t => new Promise(r => setTimeout(r, t))

  exports.frame = () => new Promise(r => requestAnimationFrame(r))

  exports.tick = () => new Promise(r => setTimeout(r, 25))

  exports.getwh = function(){
    let r = window.innerHeight / 1080
    return {
      w: window.innerWidth / r,
      h: 1080,
      r
    }
  }

  exports.throttle = function(delay, action){
    let last = 0
    return function() {
      let curr = +new Date()
      if(curr - last > delay) {
        action.apply(this, arguments)
        last = curr
      }
    }
  }

  exports.mock = true

  exports.changePage = function(newhash){
    location.hash = newhash
  }

  exports.customPieChart = function(sel, dataset){
    let radius = 86
    let width = 430
    let height = 272
    let offsetAngle = -Math.PI/4

    let color = d3.scaleOrdinal()
      .range(['#5167f2', '#fc6e51', '#ffce54', '#1bf1b7'])

    $(sel).html('')
    let svg = d3.select(sel)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    let arc = d3.arc()
      .innerRadius(radius - 40)
      .outerRadius(radius)

    let pie = d3.pie()
      .value(d => d.count)
      .sort(null)
      .startAngle(offsetAngle)

    svg.append('circle')
      .attr('r', 95)
      .attr('stroke', '#80ccff')
      .attr('stroke-width', 8)
      .attr('stroke-dasharray', '56 40')
      .attr('fill', 'none')
      .attr('opacity', .2)

    svg.selectAll('path')
      .data(pie(dataset))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.label))

    let polyfunc = datum => datum.map(d => {
      let centerPos = arc.centroid(d)
      let cAngle = (d.startAngle + d.endAngle) / 2
      if(cAngle < 0) cAngle = Math.PI * 2 + cAngle
      d.isRight = cAngle < Math.PI
      let istop = cAngle < Math.PI / 4 || cAngle > Math.PI * 7 / 4
      let isbottom = cAngle > Math.PI * 3 / 4 && cAngle < Math.PI * 5 / 4
      if (istop || isbottom) {
        let midPos = [...centerPos]
        midPos[0] += 33 * (d.isRight ? 1 : -1)
        midPos[1] -= 33 * (istop ? 1 : -1)
        let linePos = [...midPos]
        linePos[0] += 115 * (d.isRight ? 1 : -1)
        d.polypos = [centerPos, midPos, linePos]
      } else {
        let linePos = [...centerPos]
        linePos[0] += 130 * (d.isRight ? 1 : -1)
        d.polypos = [centerPos, linePos]
      }
      return d
    })

    let polyset = polyfunc(pie(dataset))

    svg.selectAll('polyline')
      .data(polyset)
      .enter()
      .append('polyline')
      .attr('points', d => d.polypos)
      .attr('stroke', d => color(d.data.label))
      .attr('stroke-width', 1)
      .attr('fill', 'none')

    let labels = svg.selectAll('g.label')
      .data(polyset)
      .enter()
      .append('g')
      .attr('class', 'label')
      .attr('transform', d => {
        let pos = [...d.polypos[d.polypos.length - 1]]
        pos[1] -= 9
        d.isRight && (pos[0] -= 83)
        return `translate(${pos})`
      })

    labels.append('text')
      .text(d => d.data.label)
      .attr('fill', d => color(d.data.label))
      .attr('font-size', 16)

    labels.append('rect')
      .attr('width', 45)
      .attr('height', 20)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('fill', d => color(d.data.label))
      .attr('x', 36)
      .attr('y', -16)

    labels.append('text')
      .text(d => {
        let percent = (d.endAngle - d.startAngle) / (Math.PI * 2)
        return Math.round(percent * 100) + '%'
      })
      .attr('fill', 'white')
      .attr('x', 45)
      .attr('y', 0)
      .attr('font-size', 14)
  }

  exports.customHistogram = function(sel, dataset){
    let option = {
      color: ['rgba(0,240,255,0.4)'],
      grid: {
        top: -1,
        left: 60,
        right: 0,
        bottom: 30,
        containLabel: false
      },
      xAxis :{
        type : 'category',
        data : ['1', '2', '3', '4', '5', '6', '7'],
        axisTick: {
          alignWithLabel: true,
          show:false
        },
        axisLine: {
          lineStyle:{
            color: 'rgba(0,240,255,0.8)'  //x轴 
          }     
        },
        axisLabel:{
          textStyle:{
            color: 'rgba(111,135,214,1)',
            fontSize: 14
          },
        },
      },
      yAxis: {
        type : 'value',
        min:0,
        max:230,
        splitNumber :5,
        axisTick:{
          show:false,   //刻度是否显示
          length:'5',
          interval:'2'
        },
        splitLine:{   
          lineStyle:{
            color:'rgba(0,240,255,0.2)' // x轴颜色  网格
          }
        },
        axisLine: {
          lineStyle:{
            color: 'rgba(0,240,255,1)',  //x轴 
          },
        },
        axisLabel:{
          textStyle:{
            color: 'rgba(111,135,214,1)',
            fontSize: 14
          },
          showMaxLabel: false,
        },
      },
      series : [{
        name: '直接访问',
        type: 'bar',
        barWidth: 19,
        data: dataset
      }]
    }
    let chart = echarts.init($(sel)[0])
    chart.setOption(option)
  }

  exports.customLineChart = function(sel, dataset){
    let lineStyle = {
      type:'line',
      smooth: true,//平滑曲线
      showSymbol: false,
      itemStyle : {
        normal : {  
          lineStyle:{  
            width: 0
          },
          areaStyle:{
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(0,168,198,.1)'
              }, {
                offset: 1, color: 'rgba(0,168,198,1)'
              }]
            }
          }
        } 
      }
    }
    let option = {
      toolbox: {
        feature: {
          mark : {show: true}   
        }
      },
      grid: {
        top: '-1',
        left: '14',
        right: '-1',
        bottom: '26px',
        containLabel: false,
      },
      xAxis : {
        type: 'value',
        axisTick:{
          show: false,   //刻度是否显示
        },
        min: 0.5,
        max: 7.5,
        axisLine: {
          lineStyle:{
            color: '#00f0ff',  //x轴 
          }
        },
        axisLabel:{
          textStyle:{
            color: '#fff',
            fontSize: 14
          },
          showMinLabel: false,
          showMaxLabel: false,
        },
        splitLine:{
          show: true,   
          lineStyle:{
            color:'rgba(0,240,255,0.2)' // x轴颜色  网格
          },
        },
      },
      yAxis : {
        type : 'value',
        max: 90,
        axisTick: {
          show: false //刻度是否显示
        },
        axisLine: {
          lineStyle:{
            color: '#00d6e5', //y轴
          }     
        },
        axisLabel:{
          show: false  //是否显示y轴
        },
        splitLine:{
          lineStyle:{
            color:'rgba(0,240,255,0.2)' //y轴颜色 网格
          }
        }
      }
    }

    option.series = dataset.map((d, i) => {
      let out = Object.assign({}, lineStyle)
      out.name = 'l' + i
      out.data = d
      return out
    })
    let chart = echarts.init($(sel)[0])
    chart.setOption(option)
  }

  exports.customHistogramR = function(sel, dataset){
    let option = {
      grid: {
        top: 0,
        left: 88,
        right: 0,
        bottom: 0,
        containLabel: false
      },
      xAxis: {
        show: false,
        type: 'value',
        splitLine: {
          show: false
        },
        boundaryGap: [0, 0.01]
      },
      yAxis: {
        type: 'category',
        splitLine:{
          show:false
        },
        axisTick:{
          show:false   //刻度是否显示
        },
        axisLine: {
          show:false            
        },
        axisLabel:{
          margin: 88,
          textStyle:{
            color: '#6f87d6',
            align: 'left',
            fontSize: 16
          }
        }, 
        data: dataset.map(d => d[0])
      },
      series: [{
        name: '2011年',
        type: 'bar',
        barWidth :28,
        label: {
          normal: {
            show: true,
            position:'insideRight',
            offset: [-12, -3],
            textStyle:{
              color: '#ffccd7',
              fontSize: 16
            }
          }
        },
        itemStyle:{
          normal:{
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [{
                offset: 0, color: 'rgba(255,0,0,.3)'
              }, {
                offset: 1, color: 'rgba(255,0,0,.5)'
              }]
            }               
          }
        },
        data: dataset.map(d => d[1])
      }]
    }
    let chart = echarts.init($(sel)[0])
    chart.setOption(option)
  }
})