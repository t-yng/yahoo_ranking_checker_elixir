/* global $, Handlebars, localStorage */

const SEARCH_TEXT_KEY = 'search-text'
const STARTUP_CONFIG_KEY = 'startup-config'

$(function () {
  const isStartupShow = JSON.parse(localStorage.getItem(STARTUP_CONFIG_KEY)) || false
  $('#startup-config').prop('checked', isStartupShow)

  if (isStartupShow) {
    appendSearchText($('.search-textarea'))
  }
})

$('#upload-csv').on('change', e => {
  const file = e.target.files[0]
  const reader = new FileReader()

  reader.onload = e => {
    const text = e.target.result
    $('.search-textarea').text(text)
  }

  reader.readAsText(file)
})

// テキストエリアに表示された検索条件を保存
$('#save-search-text').on('click', function () {
  const searchText = getSearchText()
  localStorage.setItem(SEARCH_TEXT_KEY, searchText)
  alert(`テキストエリア上のの検索条件を保存しました。\n\n${searchText}`)
})

// 保存された検索条件を表示
$('#append-search-text').on('click', function () {
  appendSearchText($('.search-textarea'))
})

// ページが表示される時に検索条件が常に表示される設定の追加
$('#startup-config').change(function () {
  if ($(this).is(':checked')) {
    localStorage.setItem(STARTUP_CONFIG_KEY, 'true')
  } else {
    localStorage.setItem(STARTUP_CONFIG_KEY, 'false')
  }
})

// 検索キーワードと商品ページURLから商品ページの掲載順位を検索
$('#search-ranking-btn').on('click', () => {
  // 検索中のモーダルを表示
  const showModalTimer = setTimeout(function () {
    $('.searching-modal').show()
  }, 500)

  const text = $('.search-textarea').val()
  const data = {data: createJsonFromCsv(text)}

  // サーバーへ検索リクエストを送信
  fetch('/api/ranking', {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(data)
  })
  .then(res => res.json())
  .then(json => {
    // 検索結果をテーブルに表示
    showSearchResultTable(json)

    // CSVを出力するためのテーブルを生成
    createExportTable(json)

    // CSV出力の処理を追加
    $('#export-csv').on('click', function () {
      ExcellentExport.csv(this, 'export-table')
    })

    // モーダルを表示する指定時間より早く検索結果を取得した場合は、モーダルを表示しない
    clearTimeout(showModalTimer)
    $('.searching-modal').hide()
  })
})

Handlebars.registerHelper('showRankText', cond => cond > 0 ? `${cond}位` : 'ランク外')

function getSearchText () {
  return $('.search-textarea').val()
}

function appendSearchText ($element) {
  const searchText = localStorage.getItem(SEARCH_TEXT_KEY) || ''
  const textareaText = getSearchText()

  // カーソルの位置に関係なく一番最後に保存された検索条件を追記
  const lines = textareaText.split("\n").filter(str => str.length > 0)
  lines.push(searchText)
  const text = lines.join("\n")

  $($element).val(text)
}

function showSearchResultTable (json) {
  const source = $('#result-table-template').html()
  const template = Handlebars.compile(source)
  const html = template(json)

  $('#result-table-container').html(html)
}

function createExportTable (json) {
  const source = $('#export-table-template').html()
  const template = Handlebars.compile(source)
  const html = template(json)

  $('#export-table-container').html(html)
}

/**
 * csv形式の文字列をjson形式に変換
 * @type {string} text csv形式の文字列
 * @return {string} json形式の文字列
 */
function createJsonFromCsv (text) {
  console.log(text.split(/\r\n|\r|\n/))
  return text.split(/\r\n|\r|\n/)
    .filter(line => line.length > 0)
    .map(line => {
      const columns = line.split(',')
      const keywords = columns[0].trim()
      const pageUrl = columns[1].trim()

      return {keywords, page_url: pageUrl}
    })
}
