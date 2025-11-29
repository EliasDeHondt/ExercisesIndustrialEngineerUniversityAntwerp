% @author EliasDH Team
% @see https://eliasdh.com
% @since 01/01/2025

% Example 3
I=imread('house.jpg');
Igray=rgb2gray(I);
BW=im2bw(Igray,graythresh(Igray));
BW=~BW;

edges=edge(BW,'canny',[0.05 0.2]);

[H,theta,rho]=hough(edges);
P=houghpeaks(H,20,'Threshold',0.3*max(H(:)),'NHoodSize',[15 15]);
lines=houghlines(edges,theta,rho,P,'FillGap',5,'MinLength',30);

figure;imshow(I);hold on;
for k=1:length(lines)
    xy=[lines(k).point1;lines(k).point2];
    plot(xy(:,1),xy(:,2),'LineWidth',3,'Color','red');
end
title('Standard Hough Transform');

lines2=houghlines(edges,theta,rho,P,'FillGap',20,'MinLength',50);
figure;imshow(I);hold on;
for k=1:length(lines2)
    xy=[lines2(k).point1;lines2(k).point2];
    plot(xy(:,1),xy(:,2),'LineWidth',4,'Color','green');
end
title('Probabilistic Hough');

try
    linesLSD=lineSegmentDetector(edges);
    figure;imshow(I);hold on;
    for k=1:size(linesLSD,1)
        xy=linesLSD(k,1:4);
        line(xy([1 3]),xy([2 4]),'Color','cyan','LineWidth',2.5);
    end
    title('LSD Line Segment Detector');
catch
end

skel=bwmorph(BW,'skel',Inf);
edges_skel=edge(skel);
[Hs,Ts,Rs]=hough(edges_skel);
Ps=houghpeaks(Hs,15);
lines_s=houghlines(edges_skel,Ts,Rs,Ps);
figure;imshow(I);hold on;
for k=1:length(lines_s)
    xy=[lines_s(k).point1;lines_s(k).point2];
    plot(xy(:,1),xy(:,2),'LineWidth',2,'Color','yellow');
end
title('Skeleton + Hough');