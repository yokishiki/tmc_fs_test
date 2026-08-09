import { useCallback } from "react";

import styles from "./main.module.scss";


type FilterProps = {
	value: string,
	updateValue(newValue: string): void,
};

export default function Filter(props: FilterProps) {
	const onChange = useCallback((event: React.ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
		props.updateValue(event.target.value);
	}, []);

	return (
		<div className={ styles.value }>
			<span>Поиск:</span>
			<input value={ props.value } placeholder="Поиск" onChange={ onChange } />
		</div>
	);
}