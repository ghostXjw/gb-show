requirejs.config({
  baseUrl: 'lib',
  paths: {
    app: '../js',
    jquery: 'jquery',
    'jquery.jedate': '../js/jquery.jedate',
    three: 'three',
    tween: 'Tween',
    echarts: 'echarts',
    d3: 'd3',
    handlebars: 'handlebars',
    moment: 'moment-with-locales',
  }
})

requirejs(['app/basic'], basic => basic.init())