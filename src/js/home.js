define(function(require, exports){
  const Handlebars = require('handlebars')
  const $ = require('jquery')
  const earth = require('app/earth')
  const {
    customPieChart,
    customHistogram,
    customLineChart,
    customHistogramR,
    sleep, tick, getwh, mock, throttle
  } = require('app/func')

  let inited = false
  let $page = $('#page-home')
  let $topicblock = $page.find('.topicblock')
  let $topicitems = $topicblock.find('>.item')
  let $reportBtn = $('#home-report-btn')
  let $detail = $('#home-report-mask>.detail')
  let $detailCont = $('#home-report-mask>.detail>.cont')
  let $closeBtn = $('#home-report-mask>.detail>.cont>.close')
  let $list
  let $mask = $('#home-report-mask')
  let $shims = $('#home-report-mask>.shim')
  let $lbtn = $('#home-report-mask>.left')
  let $rbtn = $('#home-report-mask>.right')
  let $detailWithShims = $shims.add($detail)

  let tpl_todayInfo = Handlebars.compile($('#home-todayinfo').html())
  let tpl_topicList = Handlebars.compile($('#home-topiclist').html())
  let tpl_reportList = Handlebars.compile($('#tpl-home-reportlist').html())

  let isDetail = false
  let isMask = false
  let getReportData

  $('#page-home>*').addClass('fadeOut')

  exports.init = async function(){
    $('#page-home>*').css('transition', '')
    $('#page-home>*').removeClass('fadeOut')
    earth.hideDetailView()    
    $('#head-right-search').removeClass('center')
    $('#page-home>*').removeClass('fadeOut')
    renderTodayInfo()
    renderLcharts()
    renderRchart()
    renderTopic1Chart()
    renderTopic1Cont()
    renderTopic2Chart()
    renderTopic2Cont()
    if(mock){
      getReportData = getReportDataMock
    }
    if(!inited){
      inited = true
      $list = getReportData()
      $mask.append($list)
      $reportBtn.on('click', throttle(1000, onReportBtnClick))
      $mask.on('mousedown', e => e.stopPropagation())
      $mask.on('mousemove', e => e.stopPropagation())
      $mask.on('mouseup', e => e.stopPropagation())
      $mask.on('click', '>.list>.item', throttle(1000, onMaskClickListItem))
      $closeBtn.on('click', throttle(1000, onCloseBtnClick))
      $rbtn.on('click', throttle(1000, onRbtnClick))
      $lbtn.on('click', throttle(1000, onLbtnClick))
    }
  }

  exports.clean = async function() {
    $('#page-home>*').addClass('fadeOut')
    earth.showDetailView()
  }

  async function onReportBtnClick(){
    if(!isMask){
      $mask.show()
      $mask.addClass('active')
      $list.addClass('enter')
      await sleep(500)
      $list.removeClass('enter')
    }else{
      $mask.removeClass('active')
      await sleep(500)
      $mask.hide()
    }
    isMask = !isMask
  }

  async function onMaskClickListItem(e){
    let $item = $(e.currentTarget)
    // 在改变列表item之前获取它的宽高
    let rect = $item[0].getBoundingClientRect()
    let wh = getwh()
    $item.siblings().addClass('fadeOut')
    $item.addClass('fadeCont')
    $detailCont.addClass('hide')
    await sleep(500)
    $list.hide()
    $item.siblings().removeClass('fadeOut')
    $item.removeClass('fadeCont')
    let left =  (rect.left + rect.width / 2) / wh.r - wh.w / 2
    let top = (rect.top + rect.height / 2) / wh.r - 20 - wh.h / 2
    $detail.css({
      display: 'block',
      transform: `translate(${left}px, ${top}px) scale(0.1792, 0.3626) rotateY(90deg)`
    })
    // 这里用tick时间不够，还是会造成动画过渡消失
    // 实测sleep(60)也会出现，所以这里调到sleep(80)
    // 当然也可能是我机器没显卡的问题，卡帧了
    // 但添加80ms延迟不会对视觉效果造成太大影响
    await sleep(80)
    $detail.css('transform', '')
    await sleep(400)
    $shims.removeClass('hide')
    $detailCont.removeClass('hide')
    isDetail = true
  }

  async function onCloseBtnClick(){
    $shims.addClass('hide')
    $detail.addClass('fadeOut')
    setTimeout(function() {
      $detail.removeClass('fadeOut')
      $detail.hide()
    }, 500)
    $list.show()
    $list.addClass('enter')
    await tick()
    $list.removeClass('enter')
    isDetail = false
  }
  async function onRbtnClick(){
    if(isDetail){
      $detailWithShims.addClass('up')
      $detailCont.addClass('hide')
      await sleep(400)
      $detailWithShims.css('transitionDuration', '0s')
      $detailWithShims.removeClass('up')
      $detailCont.removeClass('hide')
      await sleep(400)
      $detailWithShims.css('transitionDuration', '')
    }else{
      let $newList = getReportData()
      $newList.addClass('flyright')
      $mask.append($newList)
      await tick()      
      $newList.removeClass('flyright')
      $list.addClass('flyleft')
      await sleep(400)
      $list.remove()
      $list = $newList
    }
  }
  async function onLbtnClick(){
    if(isDetail){
      $detailWithShims.css('transitionDuration', '0s')
      $detailWithShims.addClass('up')
      $detailCont.css('transitionDuration', '0s')
      $detailCont.addClass('hide')
      await tick()
      $detailWithShims.css('transitionDuration', '')
      $detailCont.css('transitionDuration', '')
      $detailWithShims.removeClass('up')
      await sleep(400)
      $detailCont.removeClass('hide')
    }else{
      let $newList = getReportData()
      $newList.addClass('flyleft')
      $mask.append($newList)
      await tick()         
      $newList.removeClass('flyleft')
      $list.addClass('flyright')
      await sleep(400)
      $list.remove()
      $list = $newList
    }
  }
  function renderTodayInfo(){
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
    $('.tabcont').html(tpl_todayInfo(mock))
  }
  function renderLcharts(){
    let dataset = [10, 52, 90, 60, 120, 130, 160]
    customHistogram('#page-home>.lchart .lchart1', dataset)
    dataset = [
      {label: '日本', count: 25},
      {label: '德国', count: 25},
      {label: '美国', count: 50},
    ]
    customPieChart('#page-home>.lchart .lchart2', dataset)
    dataset = [
      {label: '威胁', count: 25},
      {label: '法规', count: 50},
      {label: '技术', count: 25},
    ]
    customPieChart('#page-home>.lchart .lchart3', dataset)
    
  }
  function renderRchart(){
    let dataset = [
      ['国际时讯', 200], ['US.NEWS', 180], ['BBC', 160],
      ['凤凰网', 120], ['NHK', 85],
    ]
    customHistogramR('#page-home>.rchart .topchart', dataset)
  }
  function renderTopic1Chart(){
    let dataset = [[
      [0.5, 20], [1.2, 61], [1.8, 24], [2.7, 69], [3.6, 42],
      [4.4, 62], [5.3, 36], [6.4, 49], [7.5, 20],
    ],[
      [0.5, 20], [1.6, 51], [2.8, 36], [3.6, 61], [4.4, 41],
      [5.2, 86], [6.1, 23], [6.7, 62], [7.5, 20],
    ]]
    customLineChart('#page-home>.topicblock .chart', dataset)
  }
  function renderTopic1Cont(){
    let mock = {
      news: [{
        title: '习近平指挥“一带一路”交响乐之华彩篇',
        time: '05-05 08:54'
      }, {
        title: '两个月后李克强政府工作报告又一目标落实',
        time: '05-04 12:31'
      }, {
        title: '中国房价之谜：一想到房市我就陷入一种浑身瘫...',
        time: '05-03 10:34'
      }, {
        title: '客人异国寻“不存在酒店”到天亮 仅获赔百元',
        time: '05-03 16:48'
      }]
    }
    $topicitems.eq(0).find('>.cont').html(tpl_topicList(mock))
  }
  function renderTopic2Chart(){
    let dataset = [
      {label: '威胁', count: 25},
      {label: '法规', count: 50},
      {label: '技术', count: 25},
    ]
    customPieChart('#page-home>.topicblock .chart2', dataset)
  }
  function renderTopic2Cont(){
    let mock = {
      news: [{
        title: '越共中央决定免除丁罗升中央政治局委员职务',
        time: '05-05 08:54'
      }, {
        title: '村书记18年内私吞1.5亿元 被抓后村民放炮庆祝',
        time: '05-04 06:14'
      }, {
        title: '客人异国寻“不存在酒店”到天亮 仅获赔百元',
        time: '05-04 14:31'
      }, {
        title: '谢阳当庭否认所谓酷刑谣言 表示无刑讯逼供行为',
        time: '05-03 22:09'
      }]
    }
    $topicitems.eq(1).find('>.cont').html(tpl_topicList(mock))
  }
  function getReportDataMock(){
    let item = {
      title: '中共赣州市章贡区沙河镇纪律检查委员会文件',
      cont: '“蔡英文对陆态度可能变硬”，台湾《旺报》18日刊登的学者文章称，蔡英文不希望与大陆“撕破脸”，以保持战略弹性。但随着失去模糊空间、两岸互动之路几乎堵死，将逼迫蔡英文重新思考两岸政策。另一方面，她的施政满意度不断下探，危机感可想而知。在执政不佳、中间选民又逐渐流失的情况下，拥抱深绿就成为一个可能的选项。因此拥抱深绿就成为一个可能的选项。因此'
    }
    let data = {item: []}
    for(let i = 0; i < 12; i++){
      data.item.push(item)
    }
    return $(tpl_reportList(data))
  }
})

