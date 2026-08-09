import UnselectedList from "./UnselectedList";
import SelectedList from "./SelectedList";

import styles from "./main.module.scss";


export default function Main() {
	return (
		<div className={ styles.main }>
			<UnselectedList />
			<SelectedList />
		</div>
	);
}