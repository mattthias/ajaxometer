VERSION=0.9
NAME=AJAXOmeter
FILES=LICENSE README ajaxometer.js ajaxometer.php ajaxometer.svg ajaxometer.css


DIR=$(NAME)-$(VERSION)

all:
	echo "Use 'make release' to build a release."

release:
	mkdir -p $(DIR)
	cp -R $(FILES) $(DIR)
	rm -f $(DIR).tar.gz  $(DIR).tar.bz2 $(DIR).zip 
	tar -zcf $(DIR).tar.gz $(DIR)
	tar -jcf $(DIR).tar.bz2 $(DIR)
	zip -r $(DIR).zip $(DIR)
	rm -Rf $(DIR)