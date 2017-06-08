define(function(require){
  const THREE = require('three')
  const TWEEN = require('tween')
  const $ = require('jquery')
  const IDR = require('app/data')

  let $cont = $("#webgl-content")
  let $body = $(document.body)
  let $timerCta = $('#earth-timelabel')
  let $timer = $('#earth-timelabel>.time')
  let contW = $cont.width()
  let contH = $cont.height()
  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')

  let radius = 126
  let showingDetail = false
  let grabbedEarth = false
  let grabbedTimeline = false
  let grabbedHandle = false
  let timelineOffsetY = -52
  let timelineOffsetRot = Math.PI / 180 * 120
  let cameraZ = 550
  let ratio = contW / contH

  let renderer
  let scene
  let camera

  let objects = [] //存储可以交互的对象
  let mouseOnDownObj = null
  let Loader = new THREE.TextureLoader
  let raycaster = new THREE.Raycaster
  let mouse = new THREE.Vector2
  let mouseOnMouseDown = new THREE.Vector2
  let targetSceneRotation = new THREE.Euler
  let targetEarthRotation = new THREE.Euler
  let targetEarthRotationOnMouseDown = new THREE.Euler

  let targetRotation = new THREE.Euler(-timelineOffsetRot, 0, 0)
  let targetRotationOnMouseDown = new THREE.Euler
  let earth
  let earthCta
  let timeline
  let interactive = true
  // let skybox

  async function init(){
    [
      ['Borda', 'url(font/Borda.otf)'],
      ['Borda-Bold', 'url(font/Borda-Bold.woff)'],
    ].forEach(el => {
      let font = new FontFace(...el)
      font.load()
      document.fonts.add(font)
    })
    await document.fonts.ready

    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true})
    // renderer.setClearColor(0x000000)
    renderer.setSize(contW, contH)
    let webgl = renderer.domElement
    $cont.append(webgl)

    scene = new THREE.Scene
    camera = new THREE.PerspectiveCamera(45, contW / contH, 1, 100000)
    camera.position.y = 10
    camera.position.z = cameraZ

    addLights()
    // addSkybox()
    addEarth()
    addOuterRing()
    addCityLines()
    createHotSpot()
    addTimeline()
    $timerCta.addClass('active')
    
    render()
    onWindowResize()
    window.addEventListener('resize', onWindowResize)
    document.addEventListener('mousedown', onDocumentMouseDown)
    document.addEventListener('mousemove', onDocumentMouseMove)
    document.addEventListener('mouseup', onDocumentMouseUp)
    document.addEventListener('mouseout', onDocumentMouseUp)
  }

  // 根据物体的经纬度和高度计算其在右手笛卡尔坐标系中的坐标
  // 这个计算方法是根据地图的形式来的，比如说太平洋在中间还是大西洋在中间
  function latLngToVector3(lat, lon, radius) {
    let phi = lat * Math.PI / 180
    let theta = (lon - 180) * Math.PI / 180
    let x = - radius * Math.cos(phi) * Math.cos(theta)
    let y = radius * Math.sin(phi)
    let z = radius * Math.cos(phi) * Math.sin(theta)
    return new THREE.Vector3(x, y, z)
  }

  // 设置圆环的贴图
  function setRingUv(geo){
    for(let [i, uv] of geo.faceVertexUvs[0].entries()){
      if(i % 2){
        uv[0].set(0, 1)
        uv[1].set(1, 1)
        uv[2].set(1, 0)
      }else{
        uv[0].set(0, 0)
        uv[1].set(0, 1)
        uv[2].set(1, 0)
      }
    }
  }

  //更新DOM上的时间指示器
  function updateTimerDom(){
    timeline.dial.h
      .map(e => Math.round(e.userData.pos))
      .sort((a, b) => a - b)
      .map(e => `${Math.floor(e / 6)}：${e % 6}0`)
      .forEach((e, i) => $timer.eq(i).text(e))
  }

  function addObjectAtLatLng(obj, lat, lng, height = 0) {
    let pos = latLngToVector3(lat, lng, radius + height)
    obj.position.copy(pos)
    // 由于默认的up是(0,1,0), 直接指向地球(0,0,0)会导致倒置
    // 所以指向同一直线上的反方向。当然直接multiply只在地球(0,0,0)时有效
    obj.lookAt(pos.clone().multiplyScalar(1.1))
    earth.add(obj)
  }

  function getYearPng(year){
    canvas.width = 64
    canvas.height = 64
    ctx.font = '66px Borda'
    ctx.textAlign="center"
    ctx.fillStyle = '#6f87d6'
    ctx.fillText(year.toString(), 32, 56)
    return canvas.toDataURL("image/png")
  }

  function getCityPng(text){
    canvas.width = 256
    canvas.height = 64
    let [city, country] = text.split(',').map(r => r.trim())
    ctx.fillStyle = '#81ffff'
    ctx.font = '36px Borda-Bold'
    ctx.fillText(city, 3, 34)
    ctx.font = '20px Borda-Bold'
    ctx.fillText(country, 3, 56)
    return canvas.toDataURL("image/png")
  }

  function getHotspotPng(time, name){
    canvas.width = 1024
    canvas.height = 256
    ctx.fillStyle = 'rgba(255,160,67,1)'
    ctx.font = '40px Borda-Bold'
    ctx.fillText(time, 10, 100)
    ctx.font = '76px Borda-Bold'
    ctx.fillText(name, 0, 200)
    return canvas.toDataURL("image/png")
  }

  function addLights(){
    let dirLight1 = new THREE.PointLight(0xD0FDFF, 1.1, 0)
    dirLight1.position.set(0, 0, 600)
    dirLight1.lookAt(new THREE.Vector3)
    scene.add(dirLight1)

    let dirLight2 = new THREE.DirectionalLight(0x7efaff, 1)
    dirLight2.position.set(400, 400, 100)
    scene.add(dirLight2)
  }

  // function addSkybox(){
  //   let geo = new THREE.SphereGeometry(1000, 40, 40)
  //   let mat = new THREE.MeshBasicMaterial({
  //     color: 0x7efaff,
  //     map: Loader.load("img/star.png"),
  //     side: THREE.BackSide,
  //     blending: THREE.AdditiveBlending,
  //   })
  //   skybox = new THREE.Mesh(geo, mat)
  //   skybox.name = 'skybox'
  //   scene.add(skybox)
  // }

  function addEarth(){
    //地球本体，包含了一系列相关图层
    let geo = new THREE.SphereGeometry(radius, 50, 50)
    let mat = new THREE.MeshLambertMaterial({
      map: Loader.load('img/earth.jpg')
    })
    earth = new THREE.Mesh(geo, mat)
    earth.name = 'earth'
    //添加地图热点层
    for(let i of Array(4).keys()){
      let geo = new THREE.SphereGeometry(radius + 1, 50, 50)
      let mat = new THREE.MeshLambertMaterial({
        transparent: true,
        color: 0xff8340,
        blending: THREE.AdditiveBlending,
        opacity: .4,
        map: Loader.load(`img/fire${i + 1}.png`), 
      })
      let fire = new THREE.Mesh(geo, mat)
      fire.name = 'fire' + i
      earth.add(fire)
    }
    //添加地球包络
    for(let i of Array(2).keys()){
      let geo = new THREE.SphereGeometry(radius + 15, i ? 20 : 40, 30)
      let egh = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({
          color: 0x2AC7CC,
          transparent: true,
          opacity: .08 * (i + 1),
        })
      )
      egh.name = 'earth-wrapper'
      earth.add(egh)
    }
    {//添加国家边界浮层
      let geo = new THREE.SphereGeometry(radius + 15, 50, 50);
      let mat = new THREE.MeshLambertMaterial({
        blending: THREE.AdditiveBlending,
        transparent: true,
        color: 0x2AC7CC,
        opacity: .9,
        map: Loader.load("img/earth_political_alpha.png")
      })
      let earthPol = new THREE.Mesh(geo, mat)
      earthPol.name = 'earth-map-border'
      objects.push(earthPol)
      earth.add(earthPol)
    }
    //包含了地球的一个层，用来限制地轴旋转
    earthCta = new THREE.Object3D
    earthCta.rotation.x = (Math.PI / 180) * 10
    earthCta.rotation.z = (Math.PI / 180) * -20
    earthCta.rotation.y = (Math.PI / 180) * -20
    earthCta.add(earth)
    scene.add(earthCta)
  }

  function addOuterRing(){
    let geo = new THREE.PlaneGeometry(480, 480, 1, 1);
    let mat = new THREE.MeshBasicMaterial({
      map: Loader.load("img/radial_layers_medium.png"),
      transparent: true,
      opacity: .1,
    })
    let outerRing = new THREE.Mesh(geo, mat)
    outerRing.position.z = 320
    outerRing.name = 'outer-ring'
    scene.add(outerRing)
  }

  function addCityLines(){
    let lineMatOrange = new THREE.MeshBasicMaterial({
      color: 0xff8340,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    })
    let hexMat = new THREE.MeshBasicMaterial({
      color: 0xff8340,
      transparent: true,
      opacity: 0.5,
    })
    for(let j of Array(4).keys()){
      for(let i of Array(36).keys()){
        let line = new THREE.Object3D()
        line.city = IDR.cities[`phase${j+1}`][i]

        let hexGeo = new THREE.CircleGeometry(2, 6, 5)
        hexGeo.vertices.shift()
        line.hex = new THREE.LineLoop(hexGeo, hexMat)
        line.hex.z = 40
        line.add(line.hex)

        let h = Math.random() * 80 + 50
        let geo = new THREE.Geometry()
        geo.vertices.push(new THREE.Vector3(0, 0, 0))
        geo.vertices.push(new THREE.Vector3(0, 0, h))
        line.lineBlue = new THREE.LineSegments(geo, lineMatOrange)
        line.add(line.lineBlue)

        let labelGeo = new THREE.PlaneGeometry(32, 8)
        let labelMat = new THREE.MeshBasicMaterial({
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          map: Loader.load(getCityPng(line.city.name)),
          transparent: true,
          opacity: 1,
          depthWrite: false,
        })
        line.label = new THREE.Mesh(labelGeo, labelMat)
        line.label.position.set(16, 0, h)
        line.add(line.label)

        addObjectAtLatLng(line, line.city.lat, line.city.lng, 17)
      }
    }
  }

  function getSixGeometry(name){
    let	hotspot = new THREE.Object3D
    {//前两层六边形
      let s = new THREE.Shape
      s.moveTo(0, 10)
      ;[
        [9,5],[9,-5],[0,-10],[0,-6],[5,-3],[5,3],[0,6]
      ].forEach(e => s.lineTo(...e))
      let geo = new THREE.ShapeGeometry(s)
      let mat = new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: 0xff8340,
        transparent: true,
        opacity: .6,
      })
      let hexSeg1 = new THREE.Mesh(geo, mat)
      let hexSeg2 = new THREE.Mesh(geo, mat)
      hexSeg1.rotation.z = (Math.PI / 180) * -60
      hexSeg2.rotation.z = (Math.PI / 180) * 120
      hexSeg2.position.z = 3
      hotspot.add(hexSeg1)
      hotspot.add(hexSeg2)
    }
    {//第三层六边形
      let s = new THREE.Shape
      s.moveTo(0, 10)
      ;[
        [9,5],[9,-5],[0,-10],[-9,-5],[-9,5],[0,10]
      ].forEach(e => s.lineTo(...e))
      let geo = new THREE.ShapeGeometry(s)
      let mat = new THREE.LineBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: 0xff8340,
        transparent: true,
        opacity: .8,
      })
      let hexSeg3 = new THREE.Line(geo, mat)
      hexSeg3.position.set(.25, 0, 6)
      hexSeg3.scale.set(1.2, 1.2, 1.2)
      hotspot.add(hexSeg3)
    }
    {//第四层六边形
      let s = new THREE.Shape
      s.moveTo(0, 10)
      ;[
        [9,5],[9,-5],[0,-10],[-9,-5],[-8,-4.5],[0,-9],[8,-4.5],[8,4.5],[0,9]
      ].forEach(e => s.lineTo(...e))
      let geo = new THREE.ShapeGeometry(s)
      let mat = new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: 0xff8340,
        transparent: true,
        opacity: .8,
        side: THREE.DoubleSide
      })
      let hexSeg4 = new THREE.Mesh(geo, mat)
      hexSeg4.scale.set(1.5, 1.5, 1.5)
      hexSeg4.position.set(.4, 0, 9)
      hotspot.add(hexSeg4)
    }
    {//中心加号准星
      let geo = new THREE.Geometry
      geo.vertices = [
        [-3,0,0],[3,0,0],[0,3,0],[0,-3,0]
      ].map(e => new THREE.Vector3(...e))
      let mat = new THREE.LineBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: 0xff8340,
        transparent: true,
        opacity: .9,
      })
      let plus = new THREE.LineSegments(geo, mat)
      plus.position.z = 12
      hotspot.add(plus)
    }
    {//周围的装饰线,四根
      let mat = new THREE.LineBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: 0xff8340,
        transparent: true,
        opacity: .5,
      })
      let geo = new THREE.Geometry
      geo.vertices = [
        [15,0,0],[20,0,0],[-15,0,0],[-20,0,0],
        [-10,-15,0],[-12.5,-19.3,0],[-7.5,10.7,0],[-10,15,0]
      ].map(e => new THREE.Vector3(...e))
      let line = new THREE.LineSegments(geo, mat)
      line.position.z = 9
      hotspot.add(line)
    }
    {//用于处理事件点击的隐藏图形
      let geo = new THREE.CircleGeometry(15, 6, .5)
      let mat = new THREE.MeshBasicMaterial({
        visible: false,
      })
      let hidden = new THREE.Mesh(geo, mat)
      hidden.position.z = 9
      hidden.name = name
      hotspot.add(hidden)
      objects.push(hidden)
    }
    return hotspot
  }

  function createHotSpot() {
    let	hotspot = getSixGeometry('hotspot-h')
    {//高耸的线
      let geo = new THREE.Geometry()
      geo.vertices.push(new THREE.Vector3(0, 0, 0))
      geo.vertices.push(new THREE.Vector3(0, 0, 250))
      let mat = new THREE.LineBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: 0xff8340,
        transparent: true,
        opacity: .5,
      })
      let line = new THREE.Line(geo, mat)
      hotspot.add(line)
    }
    {//上面的文字
      let geo = new THREE.PlaneGeometry(80, 20)
      let mat = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        map: Loader.load(getHotspotPng('2005-01-20', 'MOON BASE OPERATIONAL')),
        transparent: true,
      })
      let title = new THREE.Mesh(geo, mat)
      title.position.set(56, 10, 0)
      hotspot.add(title)
    }
    hotspot.scale.set(1.7,1.7,1.7)
    addObjectAtLatLng(hotspot, 19.4333, -99.1333, 18)
  }

  function addTimeline(){
    let r = 120
    let t = 4 * Math.PI / 360
    timeline = new THREE.Object3D
    timeline.name = 'timeline'
    {//圆盘骨架和外层刻度
      let outerDial = new THREE.Object3D
      {//外边圆弧
        let geo = new THREE.RingGeometry(r + 17, r + 18.3, 200, 1)
        geo.rotateX(Math.PI / 2)
        let mat = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: .6,
          color: 0x6FD5F0,
          side: THREE.BackSide,
        })
        let circle = new THREE.Mesh(geo, mat)
        outerDial.add(circle)
      }
      {//表盘圆弧
        let geo = new THREE.RingGeometry(r - 3, r + 26, 200, 1)
        geo.rotateX(Math.PI / 2)
        setRingUv(geo)
        let mat = new THREE.MeshBasicMaterial({
          map: Loader.load('img/timeline-bg.png'),
          transparent: true,
          side: THREE.BackSide,
          depthWrite: false,
        })
        let circle = new THREE.Mesh(geo, mat)
        outerDial.add(circle)
      }
      {
        //内边圆弧
        let geo =  new THREE.RingGeometry(r + 3, r + 4, 200, 1)
        geo.rotateX(Math.PI / 2)
        let mat = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: .2,
          color: 0x6FD5F0,
          side: THREE.BackSide,
        })
        let circle = new THREE.Mesh(geo, mat)
        outerDial.add(circle)
      }
      {//看不见的用来处理拖动事件的圆弧
        let geo = new THREE.RingGeometry(r + 3, r + 19, 200, 1)
        geo.rotateX(Math.PI / 2)
        let mat = new THREE.MeshBasicMaterial({
          visible: false,
          side: THREE.BackSide,
        })
        let circle = new THREE.Mesh(geo, mat)
        circle.name = 'timeline-h'
        objects.push(circle)
        outerDial.add(circle)
      }
      timeline.add(outerDial)
      timeline.outerDial = outerDial
    }
    {//盘上的刻度与字符，以及热点
      let dial = new THREE.Object3D
      timeline.dial = dial
      let psize = 2.4
      let py = 1.7
      let yr = 0
      let mat = new THREE.LineBasicMaterial({
        linewidth: 1,
        color: 0x6FD5F0,
        transparent: true,
        opacity: .7,
      })
      let lineGeo = new THREE.Geometry
      //刻度盘
      for(let i of Array(360).keys()){
        let x = (r + 3.5) * Math.cos(t * i)
        let z = (r + 3.5) * Math.sin(t * i)
        //普通小刻度
        if ((i % 3 !== 0 && i <= 3 * 24)) {
          lineGeo.vertices.push(new THREE.Vector3(x, 0, z))
          lineGeo.vertices.push(new THREE.Vector3(x * 1.02, 0, z * 1.02))
        }
        //年份刻度
        if ((i % 3 === 0 && i <= (3 * 24 + 1))) {
          lineGeo.vertices.push(new THREE.Vector3(x, 0, z))
          lineGeo.vertices.push(new THREE.Vector3(x * 1.03, 0, z * 1.03))

          let pgeo = new THREE.PlaneGeometry(psize, psize) 
          let pmat = new THREE.MeshPhongMaterial({
            map: Loader.load(getYearPng(yr++)),
            alphaTest: .1
          })
          let p = new THREE.Mesh(pgeo, pmat)
          p.position.set(x * 1.03, py, z * 1.03)
          p.lookAt(new THREE.Vector3(0, 60, 0))
          dial.add(p)
        }
      }
      {//盘上的高亮
        let geo = new THREE.RingGeometry(r + 3, r + 17, 50, 1, 0, t / 2 * 24 * 6)
        geo.rotateX(Math.PI / 2)
        setRingUv(geo)
        let uv = geo.faceVertexUvs
        let mat = new THREE.MeshBasicMaterial({
          map: Loader.load('img/timeline-hl.png'),
          transparent: true,
          side: THREE.BackSide,
          depthWrite: false,
        })
        let circle = new THREE.Mesh(geo, mat)
        circle.name = 'timeline-hl'
        timeline.updateHl = function() {
          let pos = dial.h.map(e => e.userData.pos).sort((a, b) => a - b)
          let geo = new THREE.RingGeometry(r + 3, r + 17, 50, 1, t / 2 * pos[0], t / 2 * (pos[1] - pos[0]))
          geo.rotateX(Math.PI / 2)
          geo.faceVertexUvs = uv
          circle.geometry.dispose()
          circle.geometry = geo
          updateTimerDom()
        }
        dial.add(circle)
      }
      {//盘上的两个调节手柄
        let setPos = (h, pos = 0) => {
          if(pos < 0) pos = 0
          if(pos > 24 * 6) pos = 24 * 6
          h.userData.pos = pos
          let theta = t / 2 * pos
          let x = (r + 13.5) * Math.cos(theta)
          let z = (r + 13.5) * Math.sin(theta)
          h.position.set(x, py + 0.1, z)
          h.lookAt(new THREE.Vector3(0, 60, 0))
        }
        let geo = new THREE.PlaneGeometry(3, 3)
        let mat = new THREE.MeshPhongMaterial({
          map: Loader.load('img/timeline-handle.png'),
          transparent: true,
          alphaTest: 0.1
        })
        let handle = new THREE.Mesh(geo, mat)
        handle.name = 'timeline-handle'
        timeline.setPos = setPos
        dial.h = [handle, handle.clone()]
        dial.h.forEach(e => {
          objects.push(e)
          dial.add(e)
        })
        setPos(dial.h[0], 3 * 6)
        setPos(dial.h[1], 7 * 6)
        timeline.updateHl()
      }

      let line = new THREE.LineSegments(lineGeo, mat)
      dial.add(line)
      dial.rotation.y = timelineOffsetRot
      timeline.add(dial)
    }
    timeline.rotation.x = Math.PI / 180 * 5
    timeline.position.z = 530 - contW * .01
    timeline.position.y = timelineOffsetY - contW * .003
    scene.add(timeline)

    timeline.show = function(){
      new TWEEN.Tween(timeline.position)
        .to({y: timelineOffsetY - contW * .003}, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()
    }
    timeline.hide = function(){
      new TWEEN.Tween(timeline.position)
        .to({y: -100}, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start()
    }
  }

  function showDetailView(){
    showingDetail = true
    interactive = false
    timeline.hide()
  }

  function hideDetailView(){ 
    showingDetail = false
    interactive = true
    targetSceneRotation.x = 0
    targetSceneRotation.y = 0
    timeline.show()
  }

  function onWindowResize(){
    contW = window.innerWidth
    contH = window.innerHeight
    $cont.width(contW)
    $cont.height(contH)
    ratio = contW / contH
    renderer.setSize(contW, contH)
    camera.aspect = contW / contH
    camera.updateProjectionMatrix()
    camera.position.z = cameraZ
    timeline.position.z = 530 - contW * .01
    if (!showingDetail) {
      timeline.position.y = timelineOffsetY - contW * .003
    }
  }

  function updateRaycaster(event){
    if(!interactive) return
    let mouse = new THREE.Vector2
    mouse.x = (event.clientX / contW) * 2 - 1
    mouse.y = - (event.clientY / contH) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    let intersects = raycaster.intersectObjects(objects)
    if(intersects.length){
      return intersects[0].object
    }
    return {name: '', parent: {name: ''}, children: []}
  }

  function onDocumentMouseDown(event){
    if(!interactive) return
    mouseOnMouseDown.x = event.clientX
    mouseOnMouseDown.y = event.clientY
    grabbedEarth = false
    let obj = updateRaycaster(event)
    mouseOnDownObj = obj
    if(obj.name == 'earth-map-border'){
      targetEarthRotationOnMouseDown.copy(targetEarthRotation)
      grabbedEarth = true
    }else if(obj.name == 'timeline-h'){
      targetRotationOnMouseDown.x = targetRotation.x
      grabbedTimeline = true
    }else if(obj.name == 'timeline-handle'){
      obj.userData.lastPos = obj.userData.pos
      grabbedHandle = true
    }else if(obj.name == 'hotspot-h'){
      showDetailView()
      location.hash = 'search'
    }
  }

  function onDocumentMouseMove(event){
    mouse.x = event.clientX
    mouse.y = event.clientY
    let offset = new THREE.Vector2
    offset.x = mouse.x - mouseOnMouseDown.x
    offset.y = mouse.y - mouseOnMouseDown.y
    let ratio = contH / 1080
    if(showingDetail){
      targetSceneRotation.y = -(mouse.x - contW / 2) * .00007
      targetSceneRotation.x = -(mouse.y - contH / 2) * .0001
    }
    if(!interactive) return
    if(grabbedTimeline){
      targetRotation.x = targetRotationOnMouseDown.x + offset.x * 0.003
    }
    if(grabbedEarth){
      targetEarthRotation.x = targetEarthRotationOnMouseDown.x + offset.x * 0.005
      targetEarthRotation.y = targetEarthRotationOnMouseDown.y + offset.y * 0.005
    }
    if(grabbedHandle){
      timeline.setPos(mouseOnDownObj, mouseOnDownObj.userData.lastPos + offset.x * 0.056 / ratio)
      timeline.updateHl()
    }
    let obj = updateRaycaster(event)
    if(obj.name == 'earth-map-border'){
      $body.css('cursor', '-webkit-grab')
    }else if(obj.name == 'timeline-h'){
      $body.css('cursor', 'e-resize')
    }else if(obj.name == 'timeline-handle'){
      $body.css('cursor', 'pointer')
    }else if(obj.name == 'hotspot-h'){
      $body.css('cursor', 'pointer')
    }else{
      $body.css('cursor', 'auto')
    }
  }

  function onDocumentMouseUp(){
    if(!interactive) return
    grabbedEarth = false
    grabbedTimeline = false
    grabbedHandle = false
  }

  function render(){
    // skybox.rotation.x = earth.rotation.x * .25
    // skybox.rotation.y = earth.rotation.y - Math.PI / 180 * 30 * .25
    // skybox.rotation.z = earth.rotation.z * .25
    targetEarthRotation.x += 0.003
    earth.rotation.y += (targetEarthRotation.x - earth.rotation.y) * .05
    earth.rotation.x += (targetEarthRotation.y - earth.rotation.x) * .05
    scene.rotation.y += (targetSceneRotation.y - scene.rotation.y) * .05
    scene.rotation.x += (targetSceneRotation.x - scene.rotation.x) * .05
    timeline.dial.rotation.y += (-targetRotation.x - timeline.dial.rotation.y) * 0.05
    if(targetRotation.x > -2.06) targetRotation.x = -2.06
    if(targetRotation.x < -3.65) targetRotation.x = -3.65
    TWEEN.update()
    requestAnimationFrame(render)
    renderer.render(scene, camera)
  }

  return {
    init,
    showDetailView,
    hideDetailView,
    $cont
  }
})