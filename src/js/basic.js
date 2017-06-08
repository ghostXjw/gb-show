define(function(require, exports){
  const $ = require('jquery')
  const moment = require('moment')
  const earth = require('app/earth')
  const {sleep} = require('app/func')
  const pages = {
    home: require('app/home'),
    search: require('app/search'),
    topic: require('app/topic'),
  }

  let $app = $('#app')
  let $timedate = $('#head-right-time')
  let $date = $timedate.find('.date')
  let $time = $timedate.find('.time')
  let $week = $timedate.find('.week')

  let oldHash = ''
  let oldFullHash = ''

  //全局初始化入口
  exports.init = async function(){
    //初始化用到的一些库
    moment.locale('zh-cn')
    resize()
    $(window).resize(resize)
    $('.m-overtop').show()
    await earth.init()
    $(window).on('hashchange', route)
    route()
    updateTime()
  }

  //路由
  async function route(){
    let fullHash = location.hash
    let hash = fullHash.slice(1).split('/')[0]
    if(!hash){
      location.hash = hash = 'home'
    }else if(oldHash != hash){
      if(oldHash){
        //获取一份全局变量的值拷贝，防止全局变量变动影响定时回调
        let h = oldHash
        pages[oldHash].clean()
        setTimeout(function(){
          $(`#page-${h}`).hide()
        }, 1000)
      }
      await sleep(600)
      $(`#page-${hash}`).show()
      await sleep(50)
      pages[hash].init()
      oldHash = hash
    }else if(oldFullHash != fullHash){
      pages[hash].route()
      oldFullHash = fullHash
    }
  }

  //右上角时间刷新(一分钟一次)
  function updateTime(){
    let time = moment()
    $date.text(time.format('YYYY年M月D日'))
    $time.text(time.format('HH:mm'))
    $week.text(time.format('dddd'))
    setTimeout(updateTime, (60 - time.seconds()) * 1000)
  }

  //自适应控制
  //设高度始终为9，像素值为1080px
  //若宽度<=22，则为布局0；若宽度>22，则为布局1
  //根据屏幕高度对宽高按比例缩放
  function resize(){
    let winH = window.innerHeight
    let winW = window.innerWidth
    let ratio = winW / winH
    ratio < 4 / 3 && (ratio = 4 / 3)
    ratio > 32 / 9 && (ratio = 32 / 9)
    let scale = winH / 1080
    $app.css('width', ratio * 1080)
    $app.css('transform', `scale(${scale},${scale}`)
    $app.removeClass('layout0 layout1')
    if(ratio <= 22 / 9){
      $app.addClass('layout0')
    }else{
      $app.addClass('layout1')
    }
  }
})