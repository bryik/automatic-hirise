# Starts a Python3 webserver so the terrain can be viewed.
cd docs
#printf 'Starting local server...\n'
printf 'View terrain here: http://localhost:8000\n~~~~~~~~~~~~~~\n'
printf 'Press "CTRL-C" to quit.\n\n'
python3 -m http.server
