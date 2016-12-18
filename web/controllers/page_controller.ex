defmodule YahooRankinkingChecker.PageController do
  use YahooRankinkingChecker.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
