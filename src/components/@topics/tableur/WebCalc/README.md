- Formulas/FormulaParser
- Format/FormatManager
- CalcSheet : a sheet
    - PlageSelector/RangeOverlay (helper)

## API

Sheet
    - .nbRows / .nbCols
    - relativeTo(cell: Cell, row_diff: number, col_diff: number)

    - if possible, use [pos] internally... (use TH textContent to convert?)

    - cellPos(Cell) -> [row_id, col_id]

    - getRange(from_pos, to_pos);

    - do not use, prefer getRange()
        - getCells(range_str: string): CellList;
        - getCells(row_id: number, col_id: number): CellList;

    - pos2ref(number, number) -> string
    - ref2pos(string) -> [number, number]

## Issues

- repo
- doc API...

- toolbar refactor
- force size: requires div in td => overflow + scrollWidth (for the good size).
	- td is="xxx" ? => no shadowRoot.
		-> getLiss => requires => getCell() ?
		-> add properties...
		-> edit mode...
- misc :
	- Ctrl+C put data in pastebin ?
	- font_size is editable.
- toolbar
	- select fonts
	- underline style...
	- better CSS
	- color under foreground/background color.
	- disable merge icons when :
		- merge : can't merge
		- unmerge : can't unmerge
		- merge_center : only one selected...
	- format monnaie : select...
	- top bar...
	- borders
	- cond format.
	- align_* resets indent...
	- default format digit precision (hard)
	- cancel number format when clicking on it...
- formula
	- move/resize ref plages.
	- add ref plages by clicking.
	- errors in formulas
	- better deduce format (per operations and type, LO stupid)
- selection
	- cell should not be highlighted when the cell is being edited.
	- move selection (requires to modify formulas pointing to it...)
	- do not move cursor if selection.
	- super+ctrl+keys (boff)
		- super+keys  (boff)
	- nav with tab/enter (boff)
- recopie
	- delete data when dest is in original selection.
	- handle repeat and different shapes.
- misc :
	- shows 100.00% when "=100%".
	- resize/merge cols/lines
	- ctrl+Z...
	- graphs (outside).
	- copy area : animate dashed border.