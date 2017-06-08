define(function(require){
  const Handlebars = require('handlebars')
  const $ = require('jquery')
  const earth = require('app/earth')
  const {tick, sleep} = require('app/func')
  require('jquery.jedate')

  let $backbtn = $('#page-search .back-btn')
  let $leftnav = $('#page-search .leftnav')
  let $articleList = $('#page-search .articleList')
  let $listcon = $('#page-search .articleList .listcon')

  let $articledetail = $('#page-search .articledetail')
  let $page = $('#page-search .page')

  let tpl_list = Handlebars.compile($('#tpl-search-list').html())

  let inited = false

  let start = {
    minDate: '2014-06-16 23:59:59', //设定最小日期为当前日期
      //festival:true,
    maxDate: $.nowDate({DD:0}), //最大日期
    choosefun: function(elem,datas){
      end.minDate = datas; //开始日选好后，重置结束日的最小日期
    }
  }
  let end = {
    minDate: $.nowDate({DD:0}), //设定最小日期为当前日期
    maxDate: '2099-06-16 23:59:59', //最大日期
    choosefun: function(elem,datas){
      start.maxDate = datas; //将结束日的初始值设定为开始日的最大日期
    }
  }

  function init(){
    $('#head-right-search').addClass('center')
    $leftnav.addClass('show')
    $page.addClass('show')
    $backbtn.addClass('show')
    earth.$cont.addClass('moveRight')
    earth.showDetailView()
    setTimeout(route, 500)
    if(!inited){
      inited = true
      $("#start").jeDate(start)
      $("#end").jeDate(end)
      renderDetailList()
      $backbtn.on('click', function(){history.back()})
      $('#start,#end').on('click',function(){
        setTimeout(function(){
          $('.jedatebox').addClass('show')
        },100)
      })
    }
  }

  async function clean(){
    $('#head-right-search').removeClass('center')
    earth.$cont.removeClass('moveRight')
    $backbtn.removeClass('show')    
    $leftnav.removeClass('show')
    $articleList.removeClass('show')
    $articledetail.removeClass('show')
    $page.removeClass('show')
  }

  async function route(){
    let isDetail = location.hash.split('/').length > 1
    if(isDetail){
      $articleList.removeClass('show')
      await sleep(300)
      $articleList.hide()
      $articledetail.show()
      await tick()
      $articledetail.addClass('show')
    }else{
      $articledetail.removeClass('show')
      await sleep(300)
      $articledetail.hide()
      $articleList.show()
      await tick()
      $articleList.addClass('show')
    }
  }

  function renderDetailList(){
    let out = ''
    for(let i = 0; i < 4; i++){
      out += tpl_list()
    }
    $listcon.html(out)
  }

  return {init, clean, route}
})