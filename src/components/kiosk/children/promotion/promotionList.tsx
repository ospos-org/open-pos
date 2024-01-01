import moment from "moment";

import { Promotion } from "@/generated/stock/Api";
import { formatPromotion } from "@components/kiosk/children/promotion/promotion";

interface PromotionListProps {
	promotions: Promotion[] | undefined;
}

export default function PromotionList({ promotions }: PromotionListProps) {
	return (
		<div className="flex flex-col gap-2 max-h-42 overflow-auto">
			<p className="text-sm text-gray-400">PROMOTIONS</p>

			{promotions
				?.filter(
					(promotion) =>
						new Date(promotion.valid_till).getTime() > new Date().getTime(),
				)
				?.map((promotion) => {
					return (
						<div key={promotion.id}>
							<div className="text-blue-200 bg-blue-800 bg-opacity-40 px-4 py-2 h-fit rounded-md w-full flex flex-row justify-between">
								<p>{formatPromotion(promotion)}</p>
								<p>Expires {moment(promotion.valid_till).fromNow()}</p>
							</div>
						</div>
					);
				})}
		</div>
	);
}
