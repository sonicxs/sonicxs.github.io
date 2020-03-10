#!/bin/bash
#	echo "The number of parameters is: ${#}" 查看参数数量
#	for iDir in $@ 遍历所有参数

rm index.html
cp index_template.html index.html

#temp1="pages/computer/ZIP文件格式分析.html"
#temp1=`echo ${temp1//\//\\\/}`
#echo $temp1
#exit 0;

htmlStr=""
function findHtml()
{
	for iDir in `ls $1`
	do
		if [ -d $1"/"$iDir ]; then
			#echo "${iDir} is catalog"
			findHtml $1"/"$iDir
		elif [ -f $1"/"$iDir ]; then
			#echo "$1/$iDir is file"
			temp=$1"/"$iDir
			temp=`echo ${temp//\//\\\/}`
			#echo $temp
			#在sed是需要将htmlStr中的\加上转移字符/\,不然报错
			htmlStr=$htmlStr"<li><a href=\"$temp\">$iDir<\/a><\/li>"
		else
			echo "${iDir} is unknow"
		fi
	done
}
findHtml pages
sed -ie 's/need_li_replace/'"${htmlStr}"'/g' index.html
rm index.htmle
