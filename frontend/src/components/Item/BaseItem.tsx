import React from "react";

import type { ItemDisplay } from "../../types";

import styles from "./item.module.scss";


export type ItemProps = ItemDisplay & {
	ref?: React.Ref<HTMLDivElement | null>,
	onSelect?: () => void;
};

export const ItemComp = React.memo((props: ItemProps) => {
	return (
		<div ref={ props.ref } className={ styles.item + (props.isTemp ? ` ${ styles.temp }` : "") }>
			<div className={ styles.content }>
				<span className={ styles.label }>Id:</span>
				<span className={ styles.text }>{ props.id }</span>
				{ props.onSelect && <button type="button" disabled={ props.isTemp } onClick={ props.onSelect }>Выбрать</button> }
			</div>
		</div >
	);
});