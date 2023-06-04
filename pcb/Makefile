.PHONY: clean nuke peek

node_modules:
	npm install --save

wut.kicad_pcb: makey.js kicad.js head.kicad_pcb node_modules
	node makey.js > wut.kicad_pcb

peek: wut.kicad_pcb
	pcbnew wut.kicad_pcb

clean:
	rm -rf wut.{kicad_pcb,kicad_pcb-bak,pro} fp-info-cache

nuke: clean
	rm -rf node_modules package-lock.json
