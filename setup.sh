docker build -t yahoo_ranking_checker .
docker run -d -it -p 4000:4000 yahoo_ranking_checker