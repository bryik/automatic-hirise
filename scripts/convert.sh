inputName=$1

if [[ $# -eq 0 ]] ; then
    echo 'Missing input file name. Try again with "./convert.sh <FILE_NAME.IMG>"'
    exit 0
fi

# Determine output filename
# input name without the extension (e.g. "hypanis.IMG" -> "hypanis")
outputName="${inputName%.*}"
outputPath="./docs/"

# Get terrain info (in JSON format)
info=$(gdalinfo -mm -json $inputName)

# Extract and print the description
description=$(echo $info | jq ".description")
echo "Starting conversion of $description"

width=$(echo $info | jq ".size[0]")
height=$(echo $info | jq ".size[1]")
echo "Size is $width x $height (pixels squared)"

reducedWidth=$(($width / 100))
reducedHeight=$(($height / 100))
echo "Output file will be $reducedWidth x $reducedHeight (pixels squared) "

minElevation=$(echo $info | jq ".bands[0].computedMin")
maxElevation=$(echo $info | jq ".bands[0].computedMax")
echo "Elevation interval is [$minElevation, $maxElevation]"

echo "Converting to ${outputName}.bin, placing it in $outputPath"
gdal_translate -scale $minElevation $maxElevation 0 65535 \
    -ot UInt16 \
    -outsize $reducedWidth $reducedHeight \
    -of ENVI $inputName ${outputPath}${outputName}.bin

echo "Outputting terrainInfo.json to $outputPath"
cat <<EOF > ${outputPath}terrainInfo.json
{
  "width": $width,
  "height": $height,
  "reducedWidth": $reducedWidth,
  "reducedHeight": $reducedHeight,
  "filename": "${outputName}.bin"
}
EOF

# Remove unnecessary files
rm ${outputPath}${outputName}.bin.aux.xml
rm ${outputPath}${outputName}.hdr

printf "\n"
printf "~~~~~~~~~~~~~~~~~~~~~\n"
printf "~  Great success!!  ~\n"
printf "~~~~~~~~~~~~~~~~~~~~~\n"
printf "\n"
