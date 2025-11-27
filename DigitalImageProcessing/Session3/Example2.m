% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 2
I = imread('broken-text.tif'); 

if size(I, 3) == 3
    I_gray = rgb2gray(I);
else
    I_gray = I;
end

I_double = im2double(I_gray);
BW = imbinarize(I_double, graythresh(I_double)); 
BW_Inv = ~BW; 

CC = bwconncomp(BW_Inv); 
stats = regionprops(CC, 'Area', 'BoundingBox', 'EulerNumber', 'Eccentricity');

MIN_AREA = 100;    
MAX_AREA = 350;    
MAX_ECCENTRICITY = 0.6; 

o_indices = [];
for k = 1:CC.NumObjects
    if stats(k).EulerNumber == 0 && stats(k).Area >= MIN_AREA && stats(k).Area <= MAX_AREA && stats(k).Eccentricity < MAX_ECCENTRICITY
        o_indices = [o_indices, k];
    end
end

o_mask = ismember(labelmatrix(CC), o_indices);
BW_Clean = BW_Inv & ~o_mask;

d_template = [
    0 1 1 1 1 0 0 0;
    1 0 0 0 1 0 0 0;
    1 0 0 0 1 1 1 0;
    1 0 0 0 0 1 0 0;
    1 0 0 0 0 1 0 0;
    1 0 0 0 1 1 1 0;
    0 1 1 1 1 0 0 0;
    0 0 0 0 0 0 0 0
]; 

BW_Final = BW_Clean;
[H, W] = size(BW_Final);
[h, w] = size(d_template);

for idx = o_indices
    bbox = stats(idx).BoundingBox;
    
    center_x = round(bbox(1) + bbox(3) / 2);
    center_y = round(bbox(2) + bbox(4) / 2);

    start_row = center_y - floor(h/2);
    end_row   = center_y + ceil(h/2) - 1;
    start_col = center_x - floor(w/2);
    end_col   = center_x + ceil(w/2) - 1;
    
    valid_rows = max(1, start_row):min(H, end_row);
    valid_cols = max(1, start_col):min(W, end_col);

    template_r_start = valid_rows(1) - start_row + 1;
    template_r_end   = valid_rows(end) - start_row + 1;
    template_c_start = valid_cols(1) - start_col + 1;
    template_c_end   = valid_cols(end) - start_col + 1;

    d_template_subset = d_template(template_r_start:template_r_end, template_c_start:template_c_end);
    
    if ~isempty(valid_rows) && ~isempty(valid_cols)
        sub_image = BW_Final(valid_rows, valid_cols);
        BW_Final(valid_rows, valid_cols) = sub_image | d_template_subset;
    end
end

figure; imshow(BW); title('Origineel');
figure; imshow(BW_Final); title('Resultaat');