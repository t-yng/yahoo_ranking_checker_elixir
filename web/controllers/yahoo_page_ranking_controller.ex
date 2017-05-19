defmodule YahooRankinkingChecker.YahooPageRankingController do
  use YahooRankinkingChecker.Web, :controller

  @base_search_url "http://search.shopping.yahoo.co.jp/search?first=1&tab_ex=commerce&fr=shp-prop&oq=&aq=&mcr=9f06874e320857b7b601f34c27ca0c48&ts=1481619043&cid=&uIv=on&used=0&pf=&pt=&seller=0&mm_Check=&sc_i=shp_pc_top_searchBox&n=100"

  def index(conn, params) do
    result = params["data"]
            |> Enum.map(fn condition -> search(condition["keywords"], condition["page_url"]) end)

    json conn, %{result: result}
  end

  defp search(keywords, page_url) do
    # キーワード検索の為のURLを生成
    url = search_url(String.split(keywords, " "))

    # キーワード検索から商品ページ一覧を取得
    HTTPoison.start
    response = HTTPoison.get!(url, [], [follow_redirect: true])
    %HTTPoison.Response{status_code: 200, body: body} = response

    # 目的の商品ページの掲載順位を取得
    index = Floki.find(body, ".mdSearchList li .elItem")
           |> Enum.map(&extract_pageurl(&1))
           |> Enum.find_index(&url_match?(&1, page_url))

    rank = case index do
      nil -> -1
      index -> index + 1
    end

    # 商品画像のURLを取得
    image = extract_item_image(page_url)

    %{keywords: keywords, page_url: page_url, image: image, rank: rank}
  end

  defp extract_item_image(page_url) do
    response = HTTPoison.get!(page_url)
    %HTTPoison.Response{status_code: 200, body: body} = response

    Floki.find(body, "#itmbasic .elNew img")
    |> Floki.attribute("src")
  end

  defp extract_pageurl(item) do
    Floki.find(item, ".elName a")
    |> Floki.attribute("href")
  end

  defp url_match?([], page_url) do
    false
  end

  defp url_match?([url], page_url) do
    url == page_url
  end

  defp search_url(keywords) do
    query = keywords
            |> Enum.map(fn keyword -> URI.encode(keyword) end)
            |> Enum.join("+")

    @base_search_url <> "&p=#{query}"
  end
end
