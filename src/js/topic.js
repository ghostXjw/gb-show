define(function(require, exports){
  const $ = require('jquery')
  const Handlebars = require('handlebars')
  const {
    customPieChart,
    customHistogram,
    customHistogramR,
  } = require('app/func')
  const earth = require('app/earth')

  let $topicList = $('#page-topic>.right')
  let $backbtn = $('#page-topic>.back-btn')

  let tpl_topicList = Handlebars.compile($('#home-todayinfo').html())

  let inited = false

  $('#page-topic').addClass('fadeOut')
  
  exports.init = async function(){
    $('#back-btn').addClass('show')
    $('#page-topic').removeClass('fadeOut')
    earth.showDetailView()
    earth.$cont.addClass('fadeTop')
    renderTopicList()
    renderCharts()
    if(!inited){
      inited = true
      $backbtn.on('click', () => history.back())
    }
  }

  exports.clean = function() {
    $('#page-topic').addClass('fadeOut')
    earth.$cont.removeClass('fadeTop')
  }

  function renderTopicList(){
    let mock = {
      news: [{
        title: '台裔美军官同意美国政府指控数项罪名',
        time: '05-05 08:54',
        cont: '美国军方2015年9月逮捕台湾裔高级军官林介良(又名爱德华·林或艾迪)，指控其从事谍报活动。美联社5月4日报道称，林介良被控将军事机密泄漏给中国大陆或台湾地区，其军事审判于当天开庭。',
        from_country: '美国',
        from_media: 'BBC',
        category: '法规'
      },{
        title: '“萨德”令韩旅游业赤字规模创历史最高',
        time: '05-05 07:12',
        cont: '韩国央行4日公布的2017年3月国际收支平衡表显示，3月，韩国“经常账户”结余为59.3亿美元，自2012年3月以来连续61个月保持顺差。',
        from_country: '美国',
        from_media: 'BBC',
        category: '法规'
      },{
        title: '美众院419:1通过法案扩大对朝制裁 切断其资...',
        time: '05-05 06:34',
        cont: '韩国央行4日公布的2017年3月国际收支平衡表显示，3月，韩国“经常账户”结余为59.3亿美元，自2012年3月以来连续61个月保持顺差。',
        from_country: '美国',
        from_media: 'BBC',
        category: '法规'
      },{
        title: '希拉里最快下周将组建团队 工作将是资助“反...',
        time: '05-05 06:34',
        cont: '在竞选总统失利6个月后，希拉里准备重返政坛。据美国“政治”网站5月4日报道，美国前国务卿希拉里正在组建一个新的政治团体，该团体将资助那些抵制总统朗普议程的组织。',
        from_country: '美国',
        from_media: 'BBC',
        category: '法规'
      }]
    }
    $topicList.html(tpl_topicList(mock))
  }
  function renderCharts(){
    let dataset = [10, 52, 90, 60, 120, 130, 160]
    customHistogram('#page-topic>.charts .chart1', dataset)
    dataset = [
      {label: '日本', count: 25},
      {label: '德国', count: 25},
      {label: '美国', count: 50},
    ]
    customPieChart('#page-topic>.charts .chart2', dataset)
    dataset = [
      ['国际时讯', 200], ['US.NEWS', 180], ['BBC', 160],
      ['凤凰网', 120], ['NHK', 85],
    ]
    customHistogramR('#page-topic>.charts .chart3', dataset)
  }
})