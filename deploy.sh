if [ -d _site ]; then
  rm -rdf _site 
fi

JEKYLL_ENV=production bundle exec jekyll build -b https://ospfranco.github.io 

cd _site 
git init
git add . 
git remote add origin https://github.com/ospfranco/ospfranco.github.io 
git commit -m 'deploy' 
git push --set-upstream origin master -f